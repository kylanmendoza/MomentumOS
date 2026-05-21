import { motion } from "framer-motion";
import { toStandardTime } from "../utils/time.js";

const CATEGORY_STYLES = {
  deep_work: { bg: "rgba(124,58,237,0.08)", dot: "#7c3aed", text: "#a78bfa" },
  creative:  { bg: "rgba(167,139,250,0.08)", dot: "#a78bfa", text: "#c4b5fd" },
  review:    { bg: "rgba(167,139,250,0.06)", dot: "#a78bfa", text: "#c4b5fd" },
  break:     { bg: "rgba(34,211,238,0.08)",  dot: "#22d3ee", text: "#67e8f9" },
  personal:  { bg: "rgba(34,211,238,0.06)",  dot: "#22d3ee", text: "#67e8f9" },
  admin:     { bg: "rgba(255,255,255,0.04)", dot: "#6b7280", text: "#9ca3af" },
};

const PRIORITY_DOT = {
  high:   "bg-red-400",
  medium: "bg-yellow-400",
  low:    "bg-emerald-400",
};

function getStyles(task) {
  if (task.category && CATEGORY_STYLES[task.category]) {
    return CATEGORY_STYLES[task.category];
  }
  const lower = (task.task || "").toLowerCase();
  if (lower.includes("break") || lower.includes("rest")) return CATEGORY_STYLES.break;
  if (lower.includes("review") || lower.includes("reflect")) return CATEGORY_STYLES.review;
  return CATEGORY_STYLES.deep_work;
}

export default function TimelinePlanner({ tasks = [] }) {
  if (!tasks.length) {
    return (
      <div className="text-center py-12 text-white/20 text-sm">
        No timeline yet
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className="absolute left-[7px] top-2 bottom-2 w-px"
        style={{ background: "rgba(124,58,237,0.2)" }}
      />

      <div className="space-y-3 pl-6">
        {tasks.map((task, i) => {
          const colors = getStyles(task);
          return (
            <motion.div
              key={task.id || i}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className="relative flex gap-3 items-start p-3 rounded-xl"
              style={{
                background: colors.bg,
                border: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <div
                className="absolute -left-6 top-4 w-3.5 h-3.5 rounded-full border-2 flex-shrink-0"
                style={{
                  borderColor: colors.dot,
                  background: colors.bg,
                  boxShadow: `0 0 8px ${colors.dot}60`,
                }}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="text-[11px] font-medium flex-shrink-0"
                    style={{
                      color: colors.text,
                      fontFamily: /^\d/.test(task.time_block || task.time || "") ? "monospace" : "inherit",
                    }}
                  >
                    {toStandardTime(task.time_block || task.time)}
                  </span>
                  {task.priority && (
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority] || "bg-gray-400"}`} />
                  )}
                  {task.category && (
                    <span
                      className="text-[9px] uppercase tracking-widest font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}
                    >
                      {task.category.replace("_", " ")}
                    </span>
                  )}
                </div>
                <span className="text-sm text-white/75 leading-snug">
                  {task.task}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
