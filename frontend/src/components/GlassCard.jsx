import { motion } from "framer-motion";

export default function GlassCard({
  children,
  className = "",
  glow = false,
  hover = true,
  delay = 0,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : {}}
      className={`glass ${glow ? "glow-purple" : ""} ${className}`}
    >
      {children}
    </motion.div>
  );
}
