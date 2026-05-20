import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import AnimatedBackground from "../components/AnimatedBackground.jsx";
import Sidebar from "../components/Sidebar.jsx";
import Navbar from "../components/Navbar.jsx";
import GlassCard from "../components/GlassCard.jsx";
import AIGenerationForm from "../components/AIGenerationForm.jsx";

const tips = [
  "Be specific with goals — 'Write blog post intro' beats 'write'",
  "Include your energy peaks — morning focus or afternoon momentum?",
  "Add buffer time — the AI will schedule breaks for you",
  "Combine tasks — list everything, the AI prioritizes it",
];

export default function CreatePlan() {
  const navigate = useNavigate();

  function handleSaved() {
    setTimeout(() => navigate("/dashboard"), 1200);
  }

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <Sidebar />

      <div className="pl-64 relative z-10 min-h-screen flex flex-col">
        <Navbar title="New Plan" />

        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto grid grid-cols-12 gap-6">
            {/* Form */}
            <div className="col-span-7">
              <GlassCard className="p-7" hover={false}>
                <div className="mb-6">
                  <h2 className="font-display font-semibold text-xl text-white">
                    Generate a Schedule
                  </h2>
                  <p className="text-sm text-white/35 mt-1">
                    Tell the AI your goals and available time — it handles the rest.
                  </p>
                </div>
                <AIGenerationForm onSaved={handleSaved} />
              </GlassCard>
            </div>

            {/* Side panel */}
            <div className="col-span-5 space-y-5">
              {/* Tips */}
              <GlassCard className="p-5" delay={0.15} hover={false}>
                <h3 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-4">
                  Tips for better plans
                </h3>
                <ul className="space-y-3">
                  {tips.map((tip, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.08 }}
                      className="flex items-start gap-2.5 text-xs text-white/45 leading-relaxed"
                    >
                      <span
                        className="mt-0.5 w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-semibold"
                        style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa" }}
                      >
                        {i + 1}
                      </span>
                      {tip}
                    </motion.li>
                  ))}
                </ul>
              </GlassCard>

              {/* How it works */}
              <GlassCard className="p-5" delay={0.25} hover={false}>
                <h3 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-4">
                  How it works
                </h3>
                <div className="space-y-4">
                  {[
                    { step: "01", label: "Input your goals", detail: "Describe what you want to accomplish today" },
                    { step: "02", label: "AI structures your day", detail: "GPT-4o creates time blocks with breaks" },
                    { step: "03", label: "Review & save", detail: "Confirm the schedule and track it live" },
                  ].map((s) => (
                    <div key={s.step} className="flex gap-3">
                      <span
                        className="text-[10px] font-mono font-semibold flex-shrink-0 mt-0.5"
                        style={{ color: "rgba(124,58,237,0.5)" }}
                      >
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
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
