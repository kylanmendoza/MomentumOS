import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import CreatePlan from "./pages/CreatePlan.jsx";
import { SidebarProvider } from "./components/SidebarContext.jsx";

export default function App() {
  return (
    <SidebarProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create" element={<CreatePlan />} />
      </Routes>
    </SidebarProvider>
  );
}
