"use strict";

const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");

const ROOT = __dirname;
const SESSION_COOKIE = "ccg_admin_session";
const REQUIRED_ADMIN_EMAIL = "ccdughana@gmail.com";
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const loginAttempts = new Map();

function loadLocalEnvironment() {
  const envFile = path.join(ROOT, ".env");
  if (!fs.existsSync(envFile)) return;

  for (const rawLine of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadLocalEnvironment();

const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || "");
const SESSION_SECRET = String(process.env.SESSION_SECRET || "");
const SUPABASE_URL = String(process.env.SUPABASE_URL || "").trim().replace(/\/$/, "");
const SUPABASE_ANON_KEY = String(process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLIC_KEY || "").trim();
const ADMIN_NOTIFICATION_EMAIL = String(process.env.ADMIN_NOTIFICATION_EMAIL || REQUIRED_ADMIN_EMAIL).trim();
const EMAILJS_SERVICE_ID = String(process.env.EMAILJS_SERVICE_ID || "").trim();
const EMAILJS_TEMPLATE_ID = String(process.env.EMAILJS_TEMPLATE_ID || "").trim();
const EMAILJS_PRIVATE_KEY = String(process.env.EMAILJS_PRIVATE_KEY || "").trim();
// SUPABASE_SECRET_KEY is the current Supabase server key. Keep the legacy
// variable as a fallback for projects that have not migrated their API keys.
const SUPABASE_SERVER_KEY = String(
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ""
).trim();

function hasSupabaseAuthLogin() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function configurationError() {
  const missing = [];
  if (ADMIN_EMAIL !== REQUIRED_ADMIN_EMAIL) missing.push(`ADMIN_EMAIL (${REQUIRED_ADMIN_EMAIL} uniquement)`);
  if (SESSION_SECRET.length < 32) missing.push("SESSION_SECRET (32 caractères minimum)");
  if (!hasSupabaseAuthLogin() && ADMIN_PASSWORD.length < 15) missing.push("ADMIN_PASSWORD (15 caractères minimum)");
  return missing.length ? `Configuration manquante ou invalide : ${missing.join(", ")}. Copiez .env.example vers .env puis renseignez vos secrets.` : "";
}

const startupError = configurationError();

function setSecurityHeaders(response) {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
}

function sendJson(response, status, body) {
  setSecurityHeaders(response);
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(body));
}

function parseCookies(request) {
  const header = request.headers.cookie || "";
  return header.split(";").reduce((cookies, item) => {
    const separator = item.indexOf("=");
    if (separator < 0) return cookies;
    const key = item.slice(0, separator).trim();
    try {
      cookies[key] = decodeURIComponent(item.slice(separator + 1).trim());
    } catch (_) {
      // Ignore malformed cookie values.
    }
    return cookies;
  }, {});
}

function sign(value) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");
}

function sessionFromRequest(request) {
  const token = parseCookies(request)[SESSION_COOKIE];
  if (!token) return null;
  const [expiresAt, nonce, signature, ...extra] = token.split(".");
  if (extra.length || !expiresAt || !nonce || !signature || !/^\d+$/.test(expiresAt)) return null;
  const expected = sign(`${expiresAt}.${nonce}`);
  const received = Buffer.from(signature);
  const computed = Buffer.from(expected);
  if (received.length !== computed.length || !crypto.timingSafeEqual(received, computed)) return null;
  if (Number(expiresAt) <= Date.now()) return null;
  return { email: REQUIRED_ADMIN_EMAIL, expiresAt: Number(expiresAt) };
}

function isSecureRequest(request) {
  return process.env.NODE_ENV === "production" || request.headers["x-forwarded-proto"] === "https";
}

function sessionCookie(request) {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const nonce = crypto.randomBytes(24).toString("base64url");
  const token = `${expiresAt}.${nonce}.${sign(`${expiresAt}.${nonce}`)}`;
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; SameSite=Strict${isSecureRequest(request) ? "; Secure" : ""}`;
}

function clearSessionCookie(request) {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict${isSecureRequest(request) ? "; Secure" : ""}`;
}

function equalSecrets(received, expected) {
  const left = Buffer.from(received, "utf8");
  const right = Buffer.from(expected, "utf8");
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function isAllowedAdminEmail(email) {
  return String(email || "").trim().toLowerCase() === REQUIRED_ADMIN_EMAIL;
}

function clientAddress(request) {
  return String(request.headers["x-forwarded-for"] || request.socket.remoteAddress || "unknown").split(",")[0].trim();
}

function loginRetryAfter(request) {
  const now = Date.now();
  const address = clientAddress(request);
  const attempts = (loginAttempts.get(address) || []).filter((time) => now - time < LOGIN_WINDOW_MS);
  loginAttempts.set(address, attempts);
  if (attempts.length < MAX_LOGIN_ATTEMPTS) return 0;
  return Math.ceil((LOGIN_WINDOW_MS - (now - attempts[0])) / 1000);
}

function rememberFailedLogin(request) {
  const address = clientAddress(request);
  const now = Date.now();
  const attempts = (loginAttempts.get(address) || []).filter((time) => now - time < LOGIN_WINDOW_MS);
  attempts.push(now);
  loginAttempts.set(address, attempts);
}

function readJson(request, maxBytes = 4096) {
  if (request.body !== undefined) {
    try {
      let body = request.body;
      if (Buffer.isBuffer(body)) body = body.toString("utf8");
      const serialized = typeof body === "string" ? body : JSON.stringify(body);
      if (Buffer.byteLength(serialized || "", "utf8") > maxBytes) {
        return Promise.reject(new Error("Payload trop volumineux."));
      }
      return Promise.resolve(typeof body === "string" ? JSON.parse(body || "{}") : body || {});
    } catch (_) {
      return Promise.reject(new Error("JSON invalide."));
    }
  }

  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body, "utf8") > maxBytes) {
        reject(new Error("Payload trop volumineux."));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (_) {
        reject(new Error("JSON invalide."));
      }
    });
    request.on("error", reject);
  });
}

async function signInWithSupabaseAuth(email, password) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw createHttpError(503, "Supabase Auth n'est pas configuré pour le login administrateur.");
  }

  const authUrl = new URL("/auth/v1/token", SUPABASE_URL);
  authUrl.searchParams.set("grant_type", "password");

  const response = await fetch(authUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ email, password })
  });

  let payload = {};
  try {
    payload = await response.json();
  } catch (_) {
    payload = {};
  }

  if (!response.ok) {
    const message = payload?.error_description || payload?.message || "Identifiants Supabase invalides.";
    throw createHttpError(401, message);
  }

  const userEmail = String(payload?.user?.email || "").trim().toLowerCase();
  if (!userEmail || userEmail !== REQUIRED_ADMIN_EMAIL) {
    throw createHttpError(401, "Ce compte Supabase n'est pas autorisé à accéder à l'administration.");
  }

  return {
    email: userEmail,
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: Date.now() + (Number(payload.expires_in) || 3600) * 1000
  };
}

async function sendAdminRegistrationEmail(member) {
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PRIVATE_KEY) {
    return { ok: false, reason: "emailjs_not_configured" };
  }

  const data = {
    service_id: EMAILJS_SERVICE_ID,
    template_id: EMAILJS_TEMPLATE_ID,
    user_id: EMAILJS_PRIVATE_KEY,
    template_params: {
      admin_email: ADMIN_NOTIFICATION_EMAIL,
      admin_name: "Administrateur CCG",
      member_name: `${member.first_name || ""} ${member.last_name || ""}`.trim(),
      member_email: member.email || "",
      member_phone: member.phone || "",
      member_city: member.city || "",
      member_district: member.district || "",
      member_profession: member.profession || "",
      message: `Nouvelle demande d'adhésion de ${member.first_name || ""} ${member.last_name || ""}`.trim()
    }
  };

  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText || "EmailJS refusé");
  }

  return { ok: true };
}

function getSupabaseConfiguration() {
  if (!SUPABASE_URL && !SUPABASE_SERVER_KEY) return null;
  if (!SUPABASE_URL || !SUPABASE_SERVER_KEY) {
    throw new Error("La configuration Supabase est incomplète.");
  }
  if (SUPABASE_SERVER_KEY.startsWith("sb_publishable_")) {
    throw new Error("Utilisez une clé Supabase Secret pour le serveur, jamais la clé Publishable.");
  }

  let url;
  try {
    url = new URL(SUPABASE_URL);
  } catch (_) {
    throw new Error("SUPABASE_URL est invalide.");
  }
  if (url.protocol !== "https:") {
    throw new Error("SUPABASE_URL doit utiliser HTTPS.");
  }
  return {
    url: url.toString().replace(/\/$/, ""),
    serverKey: SUPABASE_SERVER_KEY,
    isCurrentSecretKey: SUPABASE_SERVER_KEY.startsWith("sb_secret_")
  };
}

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function supabaseRest(resource, options = {}) {
  const configuration = getSupabaseConfiguration();
  if (!configuration) throw createHttpError(503, "Le stockage d'administration n'est pas encore configuré.");

  const url = new URL(`rest/v1/${resource}`, `${configuration.url}/`);
  const headers = {
    apikey: configuration.serverKey,
    Accept: "application/json",
    ...options.headers
  };
  if (!configuration.isCurrentSecretKey) headers.Authorization = `Bearer ${configuration.serverKey}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  let response;
  try {
    response = await fetch(url, {
      method: options.method || "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });
  } catch (_) {
    throw createHttpError(502, "Le stockage d'administration est indisponible.");
  }

  const raw = await response.text();
  let data = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch (_) {
      data = raw;
    }
  }
  if (!response.ok) {
    console.error("Supabase REST error", response.status, typeof data === "object" ? data?.message || data?.code : data);
    if (response.status === 401 || response.status === 403) {
      throw createHttpError(503, "La clé Supabase du serveur est refusée. Remplacez SUPABASE_SECRET_KEY par la clé Secret active de ce projet.");
    }
    throw createHttpError(502, "Impossible d'enregistrer ou de charger les données d'administration.");
  }
  return { data, count: parseSupabaseCount(response.headers.get("content-range")) };
}

function parseSupabaseCount(contentRange) {
  const match = /\/(\d+)$/.exec(contentRange || "");
  return match ? Number(match[1]) : null;
}

function adminSessionOrError(request, response) {
  const session = sessionFromRequest(request);
  if (!session) {
    sendJson(response, 401, { error: "Authentification requise." });
    return null;
  }
  return session;
}

function isSameOriginRequest(request) {
  const origin = request.headers.origin;
  if (!origin) return false;
  const protocol = isSecureRequest(request) ? "https" : "http";
  return origin === `${protocol}://${request.headers.host}`;
}

function requireSameOrigin(request, response) {
  if (isSameOriginRequest(request)) return true;
  sendJson(response, 403, { error: "Origine de la requête refusée." });
  return false;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function queryString(parameters) {
  return new URLSearchParams(parameters).toString();
}

function boundedLimit(url) {
  const value = Number(url.searchParams.get("limit") || 30);
  return Number.isInteger(value) ? Math.min(Math.max(value, 1), 100) : 30;
}

function allowedFilter(url, name, values) {
  const value = url.searchParams.get(name);
  return value && values.includes(value) ? value : "";
}

function readTextField(body, name, minimum, maximum, required = true) {
  const value = typeof body[name] === "string" ? body[name].trim() : "";
  if (!value && !required) return null;
  if (value.length < minimum || value.length > maximum) {
    throw createHttpError(400, `Le champ ${name} doit contenir entre ${minimum} et ${maximum} caractères.`);
  }
  return value;
}

async function countSupabaseRows(table, filter = "") {
  const resource = `${table}?${queryString({ select: "id", limit: "1", ...(filter ? { status: `eq.${filter}` } : {}) })}`;
  const result = await supabaseRest(resource, { method: "HEAD", headers: { Prefer: "count=exact" } });
  return result.count ?? 0;
}

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp4": "video/mp4",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

function serveStatic(request, response, pathname) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    sendJson(response, 405, { error: "Méthode non autorisée." });
    return;
  }

  let requestedPath;
  try {
    requestedPath = decodeURIComponent(pathname === "/" ? "/index.html" : pathname);
  } catch (_) {
    sendJson(response, 400, { error: "Chemin invalide." });
    return;
  }

  if (requestedPath.includes("\0") || requestedPath.split("/").some((segment) => segment.startsWith("."))) {
    sendJson(response, 403, { error: "Accès refusé." });
    return;
  }

  const filePath = path.resolve(ROOT, `.${requestedPath}`);
  if (!filePath.startsWith(`${ROOT}${path.sep}`) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    sendJson(response, 404, { error: "Page introuvable." });
    return;
  }

  setSecurityHeaders(response);
  response.writeHead(200, {
    "Content-Type": MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream",
    "Cache-Control": requestedPath.endsWith(".html") ? "no-cache" : "public, max-age=3600"
  });
  if (request.method === "HEAD") response.end();
  else fs.createReadStream(filePath).pipe(response);
}

async function handleAdminApi(request, response, pathname, url) {
  const session = adminSessionOrError(request, response);
  if (!session) return;

  if (pathname === "/api/admin/overview" && request.method === "GET") {
    let storageConfigured;
    try {
      storageConfigured = Boolean(getSupabaseConfiguration());
    } catch (error) {
      return sendJson(response, 503, { error: error.message });
    }
    const overview = {
      email: session.email,
      sessionExpiresAt: session.expiresAt,
      storageConfigured
    };

    if (!overview.storageConfigured) {
      overview.message = "L'accès administrateur est prêt. Ajoutez la configuration Supabase du serveur pour gérer les données du site.";
      return sendJson(response, 200, overview);
    }

    try {
      const [newMessages, pendingRequests, publishedNews] = await Promise.all([
        countSupabaseRows("contact_messages", "new"),
        countSupabaseRows("membership_requests", "pending"),
        countSupabaseRows("news_articles", "published")
      ]);
      return sendJson(response, 200, {
        ...overview,
        message: "Les données du site sont prêtes à être administrées.",
        counts: { newMessages, pendingRequests, publishedNews }
      });
    } catch (error) {
      return sendJson(response, error.status || 502, { ...overview, storageConfigured: false, error: error.message });
    }
  }

  try {
    if (!getSupabaseConfiguration()) {
      return sendJson(response, 503, { error: "Le stockage d'administration n'est pas encore configuré." });
    }
  } catch (error) {
    return sendJson(response, 503, { error: error.message });
  }

  const contactMatch = /^\/api\/admin\/contact-messages\/([^/]+)$/.exec(pathname);
  if (pathname === "/api/admin/contact-messages" && request.method === "GET") {
    const status = allowedFilter(url, "status", ["new", "read", "archived"]);
    const resource = `contact_messages?${queryString({
      select: "id,sender_name,sender_email,message,status,created_at",
      order: "created_at.desc",
      limit: String(boundedLimit(url)),
      ...(status ? { status: `eq.${status}` } : {})
    })}`;
    try {
      const { data } = await supabaseRest(resource);
      return sendJson(response, 200, { messages: data || [] });
    } catch (error) {
      return sendJson(response, error.status || 502, { error: error.message });
    }
  }

  if (contactMatch && request.method === "PATCH") {
    if (!isUuid(contactMatch[1])) return sendJson(response, 400, { error: "Identifiant de message invalide." });
    if (!requireSameOrigin(request, response)) return;
    try {
      const body = await readJson(request);
      const status = body && ["new", "read", "archived"].includes(body.status) ? body.status : "";
      if (!status) return sendJson(response, 400, { error: "Statut de message invalide." });
      const { data } = await supabaseRest(`contact_messages?${queryString({ id: `eq.${contactMatch[1]}` })}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: { status }
      });
      if (!data?.length) return sendJson(response, 404, { error: "Message introuvable." });
      return sendJson(response, 200, { message: data[0] });
    } catch (error) {
      return sendJson(response, error.status || 400, { error: error.message || "Mise à jour impossible." });
    }
  }

  const requestMatch = /^\/api\/admin\/membership-requests\/([^/]+)$/.exec(pathname);
  if (pathname === "/api/admin/membership-requests" && request.method === "GET") {
    const status = allowedFilter(url, "status", ["pending", "approved", "rejected", "archived"]);
    const resource = `membership_requests?${queryString({
      select: "id,first_name,last_name,email,phone,city,status,reviewed_at,created_at",
      order: "created_at.desc",
      limit: String(boundedLimit(url)),
      ...(status ? { status: `eq.${status}` } : {})
    })}`;
    try {
      const { data } = await supabaseRest(resource);
      return sendJson(response, 200, { requests: data || [] });
    } catch (error) {
      return sendJson(response, error.status || 502, { error: error.message });
    }
  }

  if (requestMatch && request.method === "PATCH") {
    if (!isUuid(requestMatch[1])) return sendJson(response, 400, { error: "Identifiant de demande invalide." });
    if (!requireSameOrigin(request, response)) return;
    try {
      const body = await readJson(request);
      const status = body && ["pending", "approved", "rejected", "archived"].includes(body.status) ? body.status : "";
      if (!status) return sendJson(response, 400, { error: "Statut de demande invalide." });
      const changes = status === "pending" ? { status, reviewed_at: null } : { status, reviewed_at: new Date().toISOString() };
      const { data } = await supabaseRest(`membership_requests?${queryString({ id: `eq.${requestMatch[1]}` })}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: changes
      });
      if (!data?.length) return sendJson(response, 404, { error: "Demande introuvable." });
      return sendJson(response, 200, { request: data[0] });
    } catch (error) {
      return sendJson(response, error.status || 400, { error: error.message || "Mise à jour impossible." });
    }
  }

  const newsMatch = /^\/api\/admin\/news\/([^/]+)$/.exec(pathname);
  if (pathname === "/api/admin/news" && request.method === "GET") {
    const status = allowedFilter(url, "status", ["draft", "published", "archived"]);
    const resource = `news_articles?${queryString({
      select: "id,title,summary,body,category,cover_image_url,status,published_at,updated_at",
      order: "updated_at.desc",
      limit: String(boundedLimit(url)),
      ...(status ? { status: `eq.${status}` } : {})
    })}`;
    try {
      const { data } = await supabaseRest(resource);
      return sendJson(response, 200, { articles: data || [] });
    } catch (error) {
      return sendJson(response, error.status || 502, { error: error.message });
    }
  }

  if (pathname === "/api/admin/news" && request.method === "POST") {
    if (!requireSameOrigin(request, response)) return;
    try {
      const body = await readJson(request, 20000);
      if (!body || typeof body !== "object" || Array.isArray(body)) throw createHttpError(400, "Contenu d'article invalide.");
      if (Object.hasOwn(body, "status") && !["draft", "published"].includes(body.status)) {
        throw createHttpError(400, "Statut d'article invalide.");
      }
      const status = body.status || "draft";
      const article = {
        title: readTextField(body, "title", 3, 200),
        summary: readTextField(body, "summary", 10, 600),
        body: readTextField(body, "body", 10, 12000),
        category: readTextField(body, "category", 2, 80),
        cover_image_url: readTextField(body, "coverImageUrl", 1, 1000, false),
        status,
        published_at: status === "published" ? new Date().toISOString() : null
      };
      const { data } = await supabaseRest("news_articles", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: article
      });
      return sendJson(response, 201, { article: data?.[0] || null });
    } catch (error) {
      return sendJson(response, error.status || 400, { error: error.message || "Création d'article impossible." });
    }
  }

  if (newsMatch && request.method === "PATCH") {
    if (!isUuid(newsMatch[1])) return sendJson(response, 400, { error: "Identifiant d'article invalide." });
    if (!requireSameOrigin(request, response)) return;
    try {
      const body = await readJson(request, 20000);
      if (!body || typeof body !== "object" || Array.isArray(body)) throw createHttpError(400, "Contenu d'article invalide.");
      const changes = {};
      if (Object.hasOwn(body, "title")) changes.title = readTextField(body, "title", 3, 200);
      if (Object.hasOwn(body, "summary")) changes.summary = readTextField(body, "summary", 10, 600);
      if (Object.hasOwn(body, "body")) changes.body = readTextField(body, "body", 10, 12000);
      if (Object.hasOwn(body, "category")) changes.category = readTextField(body, "category", 2, 80);
      if (Object.hasOwn(body, "coverImageUrl")) changes.cover_image_url = readTextField(body, "coverImageUrl", 1, 1000, false);
      if (Object.hasOwn(body, "status")) {
        if (!["draft", "published", "archived"].includes(body.status)) throw createHttpError(400, "Statut d'article invalide.");
        changes.status = body.status;
        if (body.status === "published") changes.published_at = new Date().toISOString();
        if (body.status === "draft") changes.published_at = null;
      }
      if (!Object.keys(changes).length) throw createHttpError(400, "Aucune modification fournie.");
      const { data } = await supabaseRest(`news_articles?${queryString({ id: `eq.${newsMatch[1]}` })}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: changes
      });
      if (!data?.length) return sendJson(response, 404, { error: "Article introuvable." });
      return sendJson(response, 200, { article: data[0] });
    } catch (error) {
      return sendJson(response, error.status || 400, { error: error.message || "Mise à jour impossible." });
    }
  }

  return sendJson(response, 404, { error: "Route d'administration introuvable." });
}

async function handleApi(request, response, pathname, url) {
  if (startupError) {
    return sendJson(response, 503, { error: startupError });
  }

  if (pathname === "/api/member/register-notification" && request.method === "POST") {
    try {
      const body = await readJson(request, 8192);
      const member = {
        first_name: String(body.first_name || "").trim(),
        last_name: String(body.last_name || "").trim(),
        email: String(body.email || "").trim(),
        phone: String(body.phone || "").trim(),
        city: String(body.city || "").trim(),
        district: String(body.district || "").trim(),
        profession: String(body.profession || "").trim()
      };

      if (!member.first_name || !member.last_name || !member.email) {
        return sendJson(response, 400, { error: "Données d'adhésion incomplètes." });
      }

      try {
        const result = await sendAdminRegistrationEmail(member);
        return sendJson(response, 200, { ok: true, notification: result.ok ? "emailjs_sent" : "emailjs_disabled", reason: result.reason || null });
      } catch (error) {
        return sendJson(response, 200, { ok: true, notification: "emailjs_failed", message: error.message });
      }
    } catch (_) {
      return sendJson(response, 400, { error: "Requête d'alerte invalide." });
    }
  }

  if (pathname === "/api/auth/session" && request.method === "GET") {
    const session = sessionFromRequest(request);
    if (!session) return sendJson(response, 401, { authenticated: false });
    return sendJson(response, 200, { authenticated: true, email: session.email, expiresAt: session.expiresAt });
  }

  if (pathname === "/api/auth/login" && request.method === "POST") {
    const retryAfter = loginRetryAfter(request);
    if (retryAfter) {
      setSecurityHeaders(response);
      response.setHeader("Retry-After", retryAfter);
      return sendJson(response, 429, { error: "Trop de tentatives. Réessayez dans quelques minutes." });
    }

    try {
      const body = await readJson(request);
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");

      if (!isAllowedAdminEmail(email)) {
        rememberFailedLogin(request);
        return sendJson(response, 401, { error: "Adresse e-mail non autorisée." });
      }

      let loginResult;
      if (hasSupabaseAuthLogin()) {
        loginResult = await signInWithSupabaseAuth(email, password);
      } else {
        if (!equalSecrets(password, ADMIN_PASSWORD)) {
          rememberFailedLogin(request);
          return sendJson(response, 401, { error: "Adresse e-mail ou mot de passe incorrect." });
        }
        loginResult = { email, expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000 };
      }

      loginAttempts.delete(clientAddress(request));
      setSecurityHeaders(response);
      response.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "Set-Cookie": sessionCookie(request)
      });
      response.end(JSON.stringify({ authenticated: true, email: REQUIRED_ADMIN_EMAIL, provider: hasSupabaseAuthLogin() ? "supabase" : "local" }));
    } catch (error) {
      rememberFailedLogin(request);
      sendJson(response, error.status || 401, { error: error.message || "Requête de connexion invalide." });
    }
    return;
  }

  if (pathname === "/api/auth/logout" && request.method === "POST") {
    setSecurityHeaders(response);
    response.writeHead(204, { "Cache-Control": "no-store", "Set-Cookie": clearSessionCookie(request) });
    response.end();
    return;
  }

  if (pathname.startsWith("/api/admin/")) return handleAdminApi(request, response, pathname, url);

  if (pathname === "/api/admin/overview" && request.method === "GET") {
    const session = sessionFromRequest(request);
    if (!session) return sendJson(response, 401, { error: "Authentification requise." });
    return sendJson(response, 200, {
      email: session.email,
      sessionExpiresAt: session.expiresAt,
      message: "L'accès administrateur est prêt. Les modules de gestion seront ajoutés sur cette base indépendante."
    });
  }

  sendJson(response, 404, { error: "Route API introuvable." });
}

const server = http.createServer(async (request, response) => {
  const origin = `http://${request.headers.host || "localhost"}`;
  let url;
  try {
    url = new URL(request.url || "/", origin);
  } catch (_) {
    sendJson(response, 400, { error: "URL invalide." });
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    await handleApi(request, response, url.pathname, url);
    return;
  }

  if (url.pathname === "/admi.html" && !sessionFromRequest(request)) {
    response.writeHead(302, { Location: "/login.html" });
    response.end();
    return;
  }

  serveStatic(request, response, url.pathname);
});

if (require.main === module) {
  if (startupError) {
    console.error(startupError);
    process.exitCode = 1;
  } else {
    const port = Number(process.env.PORT || 3000);
    server.listen(port, () => {
      console.log(`CCG disponible sur http://localhost:${port}`);
    });
  }
}

module.exports = { handleApi, sendJson };
