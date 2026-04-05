import fetch from "node-fetch";

const getFlaskUrl = () => process.env.FLASK_URL || 'http://localhost:5001';

export const evaluateResumeWithFlask = async (fileBuffer, originalName, jobDescription = '') => {
  const base64Pdf = fileBuffer.toString('base64');

  const response = await fetch(`${getFlaskUrl()}/evaluate`, {
    method  : 'POST',
    headers : { 'Content-Type': 'application/json' },
    body    : JSON.stringify({
      resume_b64      : base64Pdf,
      job_description : jobDescription || '',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'ATS evaluation failed.');
  }

  return await response.json();
};

export const checkFlaskHealth = async () => {
  const response = await fetch(`${getFlaskUrl()}/health`);
  return response.ok;
};
