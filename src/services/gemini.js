const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const gradePatientCase = async (patientData) => {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/grade`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(patientData)
    });
  } catch (error) {
    throw new Error(
      'Could not reach the Python backend at http://127.0.0.1:8000. Start it with `npm run backend` and try again.'
    );
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Backend request failed with status ${response.status}`);
  }

  return response.json();
};
