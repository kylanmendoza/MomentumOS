import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedBackground from "../components/AnimatedBackground.jsx";
import Sidebar from "../components/Sidebar.jsx";
import Navbar from "../components/Navbar.jsx";
import GlassCard from "../components/GlassCard.jsx";
import ProgressWidgets from "../components/ProgressWidgets.jsx";
import TimelinePlanner from "../components/TimelinePlanner.jsx";
import CalendarView from "../components/CalendarView.jsx";
import TaskChecklist from "../components/TaskChecklist.jsx";
import { getPlans } from "../api/index.js";

export default function Dashboard() {
  const [plans, setPlans] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timelineView, setTimelineView] = useState("list"); // "list" or "3d"
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

      <div className="relative z-10 flex flex-col min-h-screen pl-64">
        <Navbar title="Dashboard" />

        <main className="flex-1 p-8">
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
              <div className="col-span-8 space-y-6">
                {selected && (
                  <>
                    {/* Plan header */}
                    <GlassCard className="p-6" delay={0.15} hover={false}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-xl font-semibold text-white font-display">
                            {selected.title}
                          </h2>
                          <p className="max-w-xl mt-1 text-sm leading-relaxed text-white/35">
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
                          {selected.schedule_type || "daily"}
                        </div>
                      </div>
                    </GlassCard>

                    <>
                      {/* 3D / List toggle card */}
                      <GlassCard className="p-5" delay={0.2} hover={false}>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xs font-medium tracking-widest uppercase text-white/40">
                            {timelineView === "3d" ? "3D View" : "List View"}
                          </h3>
                          <div
                            className="flex overflow-hidden rounded-lg"
                            style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                          >
                            {[
                              {
                                key: "3d", label: "3D",
                                icon: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>,
                              },
                              {
                                key: "list", label: "List",
                                icon: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12M8.25 17.25h12M3.75 6.75h.007v.008H3.75V6.75zm0 5.25h.007v.008H3.75V12zm0 5.25h.007v.008H3.75v-.008z" /></svg>,
                              },
                            ].map(({ key, label, icon }) => (
                              <button
                                key={key}
                                onClick={() => setTimelineView(key)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-all duration-150"
                                style={{
                                  background: timelineView === key ? "rgba(124,58,237,0.25)" : "transparent",
                                  color: timelineView === key ? "#a78bfa" : "rgba(255,255,255,0.3)",
                                }}
                              >
                                {icon}{label}
                              </button>
                            ))}
                          </div>
                        </div>
                        {timelineView === "3d"
                          ? <CalendarView plan={selected} onUpdate={refreshSelected} /> // TODO: Replace <Calendar3DView /> with whatever we build
                          : <TimelinePlanner tasks={selected.tasks} />}
                      </GlassCard>

                      {/* Checklist below */}
                      <GlassCard className="p-5" delay={0.25} hover={false}>
                        <h3 className="mb-4 text-xs font-medium tracking-widest uppercase text-white/40">
                          Task Checklist
                        </h3>
                        <TaskChecklist tasks={selected.tasks} onUpdate={refreshSelected} />
                      </GlassCard>
                    </>
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
