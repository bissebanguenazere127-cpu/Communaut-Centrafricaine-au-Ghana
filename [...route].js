"use strict";

// Vercel maps every /api/... URL to this serverless function. Keeping the
// authentication implementation in server.js lets local Node hosting and
// Vercel use exactly the same session and access-control code.
const { handleApi, sendJson } = require("../server.js");

module.exports = async (request, response) => {
  const forwardedProtocol = String(request.headers["x-forwarded-proto"] || "")
    .split(",")[0]
    .trim();
  const protocol = forwardedProtocol === "https" ? "https" : "http";
  const host = request.headers.host || "localhost";

  try {
    const url = new URL(request.url || "/", `${protocol}://${host}`);
    await handleApi(request, response, url.pathname, url);
  } catch (error) {
    console.error("Unhandled API error", error);
    sendJson(response, 500, { error: "Erreur interne du serveur." });
  }
};
