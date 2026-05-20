import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function Navbar({ title = "Dashboard" }) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="sticky top-0 z-20 flex items-center justify-between px-8 py-4"
      style={{
        background: "rgba(6,6,15,0.7)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <div>
        <h1 className="font-display font-semibold text-lg text-white tracking-tight">
          {title}
        </h1>
        <p className="text-xs text-white/30 mt-0.5">{dateStr}</p>
      </div>

      <div className="flex items-center gap-3">
        <Link to="/create">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="btn-primary text-white"
          >
            + New Plan
          </motion.button>
        </Link>
      </div>
    </motion.header>
  );
}
