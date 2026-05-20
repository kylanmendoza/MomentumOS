import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3001",
  headers: { "Content-Type": "application/json" },
});

export const generatePlan = (data) => api.post("/api/plan/generate", data);
export const savePlan = (data) => api.post("/api/plan/save", data);
export const getPlans = () => api.get("/api/plan");
export const toggleTask = (id, completed) =>
  api.patch(`/api/task/${id}`, { completed });

export default api;
