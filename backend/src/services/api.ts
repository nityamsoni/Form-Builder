const API_URL = "http://localhost:5000";

export const getForm = async (formId: number) => {
  const res = await fetch(`${API_URL}/forms/${formId}`);
  return res.json();
};

export const getFields = async (formId: number) => {
  const res = await fetch(`${API_URL}/fields/${formId}`);
  return res.json();
};