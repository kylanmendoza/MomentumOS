import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import AnimatedBackground from "../components/AnimatedBackground.jsx";
import Sidebar from "../components/Sidebar.jsx";
import Navbar from "../components/Navbar.jsx";
import GlassCard from "../components/GlassCard.jsx";
import AIGenerationForm from "../components/AIGenerationForm.jsx";
import CalendarView from "../components/CalendarView.jsx";
import { useSidebar } from "../components/SidebarContext.jsx";

const SCHEDULE_LABEL = {
  daily: "Daily", weekly: "Weekly", monthly: "Monthly", yearly: "Yearly",
};

const tips = [
  "Be specific — 'Write the hero section' beats 'work on landing page'",
  "Mention times if you have them — 'standup at 10 AM, gym at 6 PM'",
  "Say the horizon — 'today', 'this week', 'plan my month'",
  "List everything — the AI will prioritize and group it for you",
];

const steps = [
  { step: "01", label: "Describe your goals",    detail: "Write naturally — mention times, days, or horizons" },
  { step: "02", label: "AI builds the schedule", detail: "Detects daily/weekly/monthly/yearly and structures it" },
  { step: "03", label: "Review & save",          detail: "Confirm the plan, then edit it live on the dashboard" },
];

function TipsCard({ delay = 0 }) {
  return (
    <GlassCard className="p-5" delay={delay} hover={false}>
      <h3 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-4">
        Tips for better plans
      </h3>
      <ul className="space-y-3">
        {tips.map((tip, i) => (
          <li key={i} className="flex items-start gap-2.5 text-xs text-white/45 leading-relaxed">
            <span
              className="mt-0.5 w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-semibold"
              style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa" }}
            >
              {i + 1}
            </span>
            {tip}
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}

function HowItWorksCard({ delay = 0 }) {
  return (
    <GlassCard className="p-5" delay={delay} hover={false}>
      <h3 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-4">
        How it works
      </h3>
      <div className="space-y-4">
        {steps.map((s) => (
          <div key={s.step} className="flex gap-3">
            <span className="text-[10px] font-mono font-semibold flex-shrink-0 mt-0.5" style={{ color: "rgba(124,58,237,0.5)" }}>
              {s.step}
            </span>
            <div>
              <p className="text-xs font-medium text-white/60">{s.label}</p>
              <p className="text-[11px] text-white/25 mt-0.5">{s.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export default function CreatePlan() {
  const navigate   = useNavigate();
  const { isOpen } = useSidebar();
  const [previewData, setPreviewData] = useState(null);

  const previewPlan = useMemo(() => {
    if (!previewData) return null;
    return {
      schedule_type: previewData.scheduleType,
      created_at:    new Date().toISOString(),
      tasks: previewData.tasks.map((t, i) => ({
        id:        `preview-${i}`,
        time_block: t.time,
        task:       t.task,
        category:   t.category || "deep_work",
        priority:   t.priority || "medium",
        completed:  false,
      })),
    };
  }, [previewData]);

  function handleSaved() {
    setTimeout(() => navigate("/dashboard"), 1200);
  }

  const hasPreview = Boolean(previewData);

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <Sidebar />

      <div
        className="relative z-10 min-h-screen flex flex-col"
        style={{
          paddingLeft: isOpen ? "250px" : "96px",
          transition: "padding-left 0.45s cubic-bezier(0.25,0.46,0.45,0.94)",
        }}
      >
        <Navbar title="New Plan" />

        <main className="flex-1 px-8 pt-4 pb-6">
          {/* Container expands from centered narrow → full width on generation */}
          <div
            style={{
              maxWidth: hasPreview ? "100%" : "56rem",
              marginLeft: "auto",
              marginRight: "auto",
              width: "100%",
              transition: "max-width 0.55s cubic-bezier(0.25,0.46,0.45,0.94)",
            }}
          >
            <div className="grid grid-cols-2 gap-6">

              {/* ── LEFT COLUMN ── always contains the form */}
              <div className="space-y-5">
                <GlassCard className="p-7" hover={false}>
                  <div className="mb-6">
                    <h2 className="font-display font-semibold text-xl text-white">
                      Generate a Schedule
                    </h2>
                    <p className="text-sm text-white/35 mt-1">
                      Tell the AI your goals and available time — it handles the rest.
                    </p>
                  </div>
                  <AIGenerationForm onSaved={handleSaved} onPreview={setPreviewData} />
                </GlassCard>

                {/* Tips fold in below the form after generation */}
                <AnimatePresence>
                  {hasPreview && (
                    <motion.div
                      key="left-tips"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.35, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="space-y-5"
                    >
                      <TipsCard />
                      <HowItWorksCard />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── RIGHT COLUMN ── tips before generation, calendar after */}
              <div>
                <AnimatePresence mode="wait">
                  {hasPreview ? (
                    <motion.div
                      key="calendar"
                      initial={{ opacity: 0, x: 60 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 60 }}
                      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                      <GlassCard className="p-5" hover={false}>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-xs font-medium text-white/40 uppercase tracking-widest">
                            Schedule Preview
                          </h3>
                          <span
                            className="px-2.5 py-1 rounded-full text-[10px] font-medium"
                            style={{
                              background: "rgba(124,58,237,0.15)",
                              color:      "#a78bfa",
                              border:     "1px solid rgba(124,58,237,0.3)",
                            }}
                          >
                            {SCHEDULE_LABEL[previewData.scheduleType] || previewData.scheduleType}
                          </span>
                        </div>
                        <CalendarView plan={previewPlan} readOnly />
                      </GlassCard>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="tips-right"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: -40 }}
                      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="space-y-5"
                    >
                      <TipsCard delay={0.15} />
                      <HowItWorksCard delay={0.25} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
