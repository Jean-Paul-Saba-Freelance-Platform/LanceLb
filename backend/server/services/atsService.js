import FormData from "form-data";
import fetch from "node-fetch";

const FLASK_URL = process.env.FLASK_URL || "http://localhost:5001";

// ── Forward PDF buffer to Flask ATS microservice ──────────────
export const evaluateResumeWithFlask = async (fileBuffer, originalName) => {
  const form = new FormData();
  form.append("file", fileBuffer, {
    filename    : originalName,
    contentType : "application/pdf",
  });

  const response = await fetch(`${FLASK_URL}/evaluate`, {
    method  : "POST",
    body    : form,
    headers : form.getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "ATS evaluation failed.");
  }

  return await response.json();
};

// ── Health check — verify Flask service is reachable ─────────
export const checkFlaskHealth = async () => {
  const response = await fetch(`${FLASK_URL}/health`);
  return response.ok;
};