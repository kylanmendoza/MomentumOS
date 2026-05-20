import { motion, AnimatePresence } from "framer-motion";
import { toggleTask } from "../api/index.js";

export default function TaskChecklist({ tasks = [], onUpdate }) {
  async function handleToggle(task) {
    try {
      await toggleTask(task.id, !task.completed);
      onUpdate();
    } catch (err) {
      console.error("Failed to toggle task:", err);
    }
  }

  if (!tasks.length) {
    return (
      <div className="text-center py-8 text-white/25 text-sm">
        No tasks yet — generate a plan above
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      <AnimatePresence initial={false}>
        {tasks.map((task) => (
          <motion.li
            key={task.id}
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex items-start gap-3 p-3 rounded-xl transition-all duration-200 group cursor-pointer"
            style={{
              background: task.completed
                ? "rgba(124,58,237,0.08)"
                : "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.04)",
            }}
            onClick={() => handleToggle(task)}
          >
            {/* Checkbox */}
            <div
              className="mt-0.5 w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center border transition-all duration-200"
              style={{
                borderColor: task.completed
                  ? "#7c3aed"
                  : "rgba(255,255,255,0.2)",
                background: task.completed
                  ? "rgba(124,58,237,0.3)"
                  : "transparent",
              }}
            >
              {task.completed && (
                <svg
                  className="w-2.5 h-2.5 text-accent-light"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <span
                className="text-xs font-medium text-accent-light/70 block mb-0.5"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {task.time_block}
              </span>
              <span
                className="text-sm text-white/80 leading-snug"
                style={{
                  textDecoration: task.completed ? "line-through" : "none",
                  opacity: task.completed ? 0.4 : 1,
                }}
              >
                {task.task}
              </span>
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
