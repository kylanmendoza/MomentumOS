import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3001",
  headers: { "Content-Type": "application/json" },
});

export const generatePlan = (data) => api.post("/api/plan/generate", data);
export const savePlan     = (data) => api.post("/api/plan/save", data);
export const getPlans     = ()     => api.get("/api/plan");

// General task update — accepts any subset of { completed, time_block, task, category, priority }
export const updateTask = (id, data) => api.patch(`/api/task/${id}`, data);

// Convenience wrapper kept for TaskChecklist backward compatibility
export const toggleTask = (id, completed) => updateTask(id, { completed });

export default api;
