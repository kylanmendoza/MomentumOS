import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import AnimatedBackground from "../components/AnimatedBackground.jsx";

const features = [
  {
    icon: "⚡",
    title: "AI-Powered Planning",
    desc: "GPT-4o generates a structured time-blocked schedule from your goals in seconds.",
  },
  {
    icon: "🧱",
    title: "Persistent Dashboard",
    desc: "Every plan is saved to PostgreSQL — your productivity history lives on.",
  },
  {
    icon: "✅",
    title: "Live Task Tracking",
    desc: "Check off tasks in real time. Watch your progress metrics update instantly.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium tracking-wide"
            style={{
              background: "rgba(124,58,237,0.12)",
              border: "1px solid rgba(124,58,237,0.3)",
              color: "#a78bfa",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-accent-light animate-pulse"
            />
            AI-Powered · Powered by GPT-4o
          </span>
        </motion.div>

        {/* Hero heading */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-display font-semibold text-5xl md:text-7xl leading-[1.08] tracking-tight max-w-4xl"
        >
          Your day,{" "}
          <span className="gradient-text">intelligently</span>
          <br />
          structured
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 text-lg text-white/40 max-w-xl leading-relaxed"
        >
          MomentumOS turns your goals and available hours into a precise,
          time-blocked schedule — powered by AI, tracked in real time.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 flex items-center gap-4"
        >
          <Link to="/create">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary text-white px-8 py-3.5 text-base"
            >
              Generate My Schedule
            </motion.button>
          </Link>
          <Link to="/dashboard">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="btn-ghost px-8 py-3.5 text-base"
            >
              View Dashboard
            </motion.button>
          </Link>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl w-full"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="glass p-6 text-left"
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-sm text-white mb-2">{f.title}</h3>
              <p className="text-xs text-white/35 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-16 text-xs text-white/15"
        >
          React · Node.js · PostgreSQL · OpenAI
        </motion.p>
      </div>
    </div>
  );
}
