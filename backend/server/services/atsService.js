const getFlaskUrl = () => process.env.FLASK_URL || 'http://127.0.0.1:5001';

export const evaluateResumeWithFlask = async (fileBuffer, originalName, jobDescription = '') => {
  const form = new FormData();
  const blob = new Blob([fileBuffer], { type: 'application/pdf' });
  form.append('file', blob, originalName);
  if (jobDescription) form.append('job_description', jobDescription);

  const response = await fetch(`${getFlaskUrl()}/evaluate`, { method: 'POST', body: form });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Flask returned ${response.status}`);
  }

  return await response.json();
};

export const checkFlaskHealth = async () => {
  try {
    const response = await fetch(`${getFlaskUrl()}/health`);
    return response.ok;
  } catch (error) {
    console.error('Error checking Flask health:', error);
    return false;
  }
};
