import { motion } from "framer-motion";
import GlassCard from "./GlassCard.jsx";

function RadialProgress({ value, label, color = "#7c3aed" }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 88 88">
          <circle
            cx="44"
            cy="44"
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="6"
          />
          <motion.circle
            cx="44"
            cy="44"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-white">{value}%</span>
        </div>
      </div>
      <span className="text-[11px] text-white/40 text-center">{label}</span>
    </div>
  );
}

export default function ProgressWidgets({ plans = [] }) {
  const totalTasks = plans.reduce((s, p) => s + p.tasks.length, 0);
  const completedTasks = plans.reduce(
    (s, p) => s + p.tasks.filter((t) => t.completed).length,
    0
  );
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const plansToday = plans.filter((p) => {
    const d = new Date(p.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  return (
    <GlassCard className="p-6" delay={0.2}>
      <h3 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-5">
        Progress
      </h3>
      <div className="flex justify-around">
        <RadialProgress value={completionRate} label="Completion" color="#7c3aed" />
        <RadialProgress
          value={Math.min(plansToday * 20, 100)}
          label="Plans Today"
          color="#22d3ee"
        />
        <RadialProgress
          value={Math.min(plans.length * 10, 100)}
          label="Total Plans"
          color="#a78bfa"
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mt-6">
        {[
          { label: "Total Plans", value: plans.length },
          { label: "Tasks Done", value: completedTasks },
          { label: "Remaining", value: totalTasks - completedTasks },
        ].map((s) => (
          <div
            key={s.label}
            className="text-center p-3 rounded-xl"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <p className="text-xl font-semibold text-white">{s.value}</p>
            <p className="text-[10px] text-white/30 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
