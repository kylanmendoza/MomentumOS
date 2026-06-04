import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedBackground from "../components/AnimatedBackground.jsx";
import Sidebar from "../components/Sidebar.jsx";
import Navbar from "../components/Navbar.jsx";
import GlassCard from "../components/GlassCard.jsx";
import ProgressWidgets from "../components/ProgressWidgets.jsx";
import CalendarView from "../components/CalendarView.jsx";
import { useSidebar } from "../components/SidebarContext.jsx";
import { getPlans } from "../api/index.js";

export default function Dashboard() {
  const { isOpen } = useSidebar();
  const [plans, setPlans] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchPlans = useCallback(async () => {
    try {
      const res = await getPlans();
      setPlans(res.data);
      if (res.data.length > 0 && !selected) {
        setSelected(res.data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch plans:", err);
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    fetchPlans();
  }, []);

  async function refreshSelected() {
    const res = await getPlans();
    setPlans(res.data);
    const refreshed = res.data.find((p) => p.id === selected?.id);
    setSelected(refreshed || res.data[0] || null);
  }

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <Sidebar />

      <div
        className="relative z-10 flex flex-col min-h-screen"
        style={{
          paddingLeft: isOpen ? "250px" : "96px",
          transition: "padding-left 0.45s cubic-bezier(0.25,0.46,0.45,0.94)",
        }}
      >
        <Navbar title="Dashboard" />

        <main className="flex-1 px-8 pt-4 pb-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <motion.div
                className="w-8 h-8 border-2 rounded-full border-accent/30 border-t-accent"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
            </div>
          ) : plans.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-12 gap-6">
              {/* Left column */}
              <div className="col-span-4 space-y-6">
                <ProgressWidgets plans={plans} />

                {/* Plan list */}
                <GlassCard className="p-5" delay={0.25} hover={false}>
                  <h3 className="mb-4 text-xs font-medium tracking-widest uppercase text-white/40">
                    Your Plans
                  </h3>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {plans.map((plan) => (
                        <motion.button
                          key={plan.id}
                          onClick={() => setSelected(plan)}
                          whileHover={{ x: 3 }}
                          className="w-full p-3 text-left transition-all duration-200 rounded-xl"
                          style={{
                            background:
                              selected?.id === plan.id
                                ? "rgba(124,58,237,0.15)"
                                : "rgba(255,255,255,0.025)",
                            border:
                              selected?.id === plan.id
                                ? "1px solid rgba(124,58,237,0.4)"
                                : "1px solid rgba(255,255,255,0.04)",
                          }}
                        >
                          <p className="text-sm font-medium truncate text-white/80">
                            {plan.title}
                          </p>
                          <p className="text-[10px] text-white/30 mt-0.5">
                            {plan.tasks.filter((t) => t.completed).length}/
                            {plan.tasks.length} done ·{" "}
                            {new Date(plan.created_at).toLocaleDateString()}
                          </p>
                        </motion.button>
                      ))}
                    </AnimatePresence>
                  </div>
                </GlassCard>
              </div>

              {/* Right column */}
              <div className="col-span-8">
                {selected && (
                  <GlassCard className="p-5" delay={0.15} hover={false}>
                    {/* Compact plan header */}
                    <div className="flex items-center justify-between mb-4 gap-3">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base font-semibold text-white font-display truncate">
                          {selected.title}
                        </h2>
                        <p className="text-xs text-white/35 truncate mt-0.5">
                          {selected.goals}
                        </p>
                      </div>
                      <div
                        className="px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0"
                        style={{
                          background: "rgba(124,58,237,0.12)",
                          color: "#a78bfa",
                          border: "1px solid rgba(124,58,237,0.25)",
                        }}
                      >
                        {selected.schedule_type || "daily"}
                      </div>
                    </div>
                    <CalendarView plan={selected} onUpdate={refreshSelected} />
                  </GlassCard>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center text-center h-80"
    >
      <div
        className="flex items-center justify-center w-16 h-16 mb-5 rounded-2xl"
        style={{ background: "rgba(124,58,237,0.12)" }}
      >
        <svg
          className="w-7 h-7 text-accent-light"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
      </div>
      <h3 className="mb-2 font-semibold text-white/70">No plans yet</h3>
      <p className="mb-6 text-sm text-white/30">
        Generate your first AI-powered schedule
      </p>
      <a href="/create">
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="px-6 text-white btn-primary"
        >
          Create First Plan
        </motion.button>
      </a>
    </motion.div>
  );
}
