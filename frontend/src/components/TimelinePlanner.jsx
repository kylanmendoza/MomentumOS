import { motion } from "framer-motion";
import { toStandardTime } from "../utils/time.js";

function getBlockColor(task) {
  const lower = task.toLowerCase();
  if (lower.includes("break") || lower.includes("rest"))
    return { bg: "rgba(34,211,238,0.08)", dot: "#22d3ee", text: "#67e8f9" };
  if (lower.includes("review") || lower.includes("plan") || lower.includes("reflect"))
    return { bg: "rgba(167,139,250,0.08)", dot: "#a78bfa", text: "#c4b5fd" };
  return { bg: "rgba(124,58,237,0.06)", dot: "#7c3aed", text: "#a78bfa" };
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
      {/* Vertical line */}
      <div
        className="absolute left-[7px] top-2 bottom-2 w-px"
        style={{ background: "rgba(124,58,237,0.2)" }}
      />

      <div className="space-y-3 pl-6">
        {tasks.map((task, i) => {
          const colors = getBlockColor(task.task || task.time_block || "");
          return (
            <motion.div
              key={task.id || i}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className="relative flex gap-4 items-start p-3 rounded-xl"
              style={{
                background: colors.bg,
                border: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              {/* Dot */}
              <div
                className="absolute -left-6 top-4 w-3.5 h-3.5 rounded-full border-2 flex-shrink-0"
                style={{
                  borderColor: colors.dot,
                  background: colors.bg,
                  boxShadow: `0 0 8px ${colors.dot}60`,
                }}
              />

              {/* Time / Day / Week label */}
              <span
                className="text-[11px] font-medium flex-shrink-0 pt-0.5"
                style={{
                  color: colors.text,
                  minWidth: 72,
                  fontFamily: /^\d/.test(task.time_block || task.time || "")
                    ? "monospace"
                    : "inherit",
                }}
              >
                {toStandardTime(task.time_block || task.time)}
              </span>

              {/* Task */}
              <span className="text-sm text-white/75 leading-snug">
                {task.task}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
