import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedBackground from "../components/AnimatedBackground.jsx";
import Sidebar from "../components/Sidebar.jsx";
import Navbar from "../components/Navbar.jsx";
import GlassCard from "../components/GlassCard.jsx";
import ProgressWidgets from "../components/ProgressWidgets.jsx";
import TimelinePlanner from "../components/TimelinePlanner.jsx";
import TaskChecklist from "../components/TaskChecklist.jsx";
import { getPlans } from "../api/index.js";

export default function Dashboard() {
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
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <Sidebar />

      <div className="pl-64 relative z-10 min-h-screen flex flex-col">
        <Navbar title="Dashboard" />

        <main className="flex-1 p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <motion.div
                className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full"
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
                  <h3 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-4">
                    Your Plans
                  </h3>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {plans.map((plan) => (
                        <motion.button
                          key={plan.id}
                          onClick={() => setSelected(plan)}
                          whileHover={{ x: 3 }}
                          className="w-full text-left p-3 rounded-xl transition-all duration-200"
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
                          <p className="text-sm font-medium text-white/80 truncate">
                            {plan.title}
                          </p>
                          <p className="text-[10px] text-white/30 mt-0.5">
                            {plan.available_time}h ·{" "}
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
              <div className="col-span-8 space-y-6">
                {selected && (
                  <>
                    {/* Plan header */}
                    <GlassCard className="p-6" delay={0.15} hover={false}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="font-display font-semibold text-xl text-white">
                            {selected.title}
                          </h2>
                          <p className="text-sm text-white/35 mt-1 leading-relaxed max-w-xl">
                            {selected.goals}
                          </p>
                        </div>
                        <div
                          className="px-3 py-1.5 rounded-full text-xs font-medium"
                          style={{
                            background: "rgba(124,58,237,0.12)",
                            color: "#a78bfa",
                            border: "1px solid rgba(124,58,237,0.25)",
                          }}
                        >
                          {selected.available_time}h block
                        </div>
                      </div>
                    </GlassCard>

                    <div className="grid grid-cols-2 gap-6">
                      {/* Timeline */}
                      <GlassCard className="p-5" delay={0.2} hover={false}>
                        <h3 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-4">
                          Timeline
                        </h3>
                        <TimelinePlanner tasks={selected.tasks} />
                      </GlassCard>

                      {/* Checklist */}
                      <GlassCard className="p-5" delay={0.25} hover={false}>
                        <h3 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-4">
                          Task Checklist
                        </h3>
                        <TaskChecklist
                          tasks={selected.tasks}
                          onUpdate={refreshSelected}
                        />
                      </GlassCard>
                    </div>
                  </>
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
      className="flex flex-col items-center justify-center h-80 text-center"
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
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
      <h3 className="font-semibold text-white/70 mb-2">No plans yet</h3>
      <p className="text-sm text-white/30 mb-6">
        Generate your first AI-powered schedule
      </p>
      <a href="/create">
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="btn-primary text-white px-6"
        >
          Create First Plan
        </motion.button>
      </a>
    </motion.div>
  );
}
