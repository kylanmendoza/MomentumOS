import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { toggleTask } from "../api/index.js";

const JS_DAY_NAMES = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
const MONTH_NAMES  = ["january","february","march","april","may","june","july","august","september","october","november","december"];

function parseTaskDays(task, scheduleType, year, month, planCreatedAt) {
  const tb = (task.time_block || "").toLowerCase().trim();

  if (scheduleType === "daily") {
    const d = planCreatedAt ? new Date(planCreatedAt) : new Date();
    return (d.getFullYear() === year && d.getMonth() === month) ? [d.getDate()] : [];
  }
  if (scheduleType === "weekly") {
    const dayIdx = JS_DAY_NAMES.findIndex(d => tb.startsWith(d));
    if (dayIdx < 0) return [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const result = [];
    for (let d = 1; d <= daysInMonth; d++) {
      if (new Date(year, month, d).getDay() === dayIdx) result.push(d);
    }
    return result;
  }
  if (scheduleType === "monthly") {
    const match = task.time_block.match(/week\s*(\d)/i);
    return match ? [(parseInt(match[1]) - 1) * 7 + 1] : [];
  }
  if (scheduleType === "yearly") {
    const mIdx = MONTH_NAMES.findIndex(m => tb.startsWith(m));
    return mIdx === month ? [1] : [];
  }
  return [];
}

function FlipTaskCard({ task, onUpdate, readOnly }) {
  const [isFlipped, setIsFlipped] = useState(task.completed);

  useEffect(() => { setIsFlipped(task.completed); }, [task.completed]);

  async function handleClick() {
    if (readOnly) return;
    const next = !isFlipped;
    setIsFlipped(next);
    try {
      await toggleTask(task.id, next);
      await onUpdate?.();
    } catch {
      setIsFlipped(!next);
    }
  }

  return (
    <div
      style={{ perspective: "1000px", cursor: readOnly ? "default" : "pointer" }}
      onClick={handleClick}
      className="mb-4"
    >
      <motion.div
        style={{ transformStyle: "preserve-3d", position: "relative" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* Front — task details */}
        <div
          style={{ backfaceVisibility: "hidden" }}
          className="border-b border-gray-400 border-dashed pb-4"
        >
          <p className="text-xs font-light leading-3 text-gray-500 dark:text-gray-300">
            {task.time_block}
          </p>
          <p className="mt-2 text-lg font-medium leading-5 text-gray-800 dark:text-gray-100">
            {task.task}
          </p>
          <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
            Tap to mark complete
          </p>
        </div>

        {/* Back — completed state */}
        <div
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            position: "absolute",
            inset: 0,
          }}
          className="border-b border-purple-400 border-dashed pb-4 flex items-start gap-3"
        >
          <div className="mt-1 w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-light leading-3 text-purple-400">
              {task.time_block}
            </p>
            <p className="mt-2 text-lg font-medium leading-5 text-gray-400 line-through">
              {task.task}
            </p>
            <p className="mt-1 text-[10px] text-purple-400">Tap to undo</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function CalendarView({ plan, onUpdate, readOnly = false }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString("en-US", { month: "long", year: "numeric" });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayJS  = new Date(year, month, 1).getDay();
  const startOffset = (firstDayJS + 6) % 7;

  const cells = [
    ...Array(startOffset).fill(null),
    ...Array(daysInMonth).fill(null).map((_, i) => i + 1),
  ];
  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  const tasksByDay = useMemo(() => {
    const map = {};
    if (!plan?.tasks?.length) return map;
    plan.tasks.forEach(task => {
      parseTaskDays(task, plan.schedule_type, year, month, plan.created_at).forEach(day => {
        if (!map[day]) map[day] = [];
        map[day].push(task);
      });
    });
    return map;
  }, [plan, year, month]);

  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  useEffect(() => {
    if (!tasksByDay[selectedDay]) {
      const first = Object.keys(tasksByDay).map(Number).sort((a, b) => a - b)[0];
      if (first) setSelectedDay(first);
    }
  }, [tasksByDay]);

  const selectedTasks = tasksByDay[selectedDay] || [];

  return (
    <div className="w-full">
      <div className="w-full shadow-lg">

        {/* Calendar grid */}
        <div className="p-5 rounded-t dark:bg-gray-800">
          <div className="flex items-center justify-between px-4">
            <span tabIndex="0" className="text-base font-bold text-gray-800 focus:outline-none dark:text-gray-100">
              {monthName}
            </span>
            <div className="flex items-center">
              <button
                aria-label="calendar backward"
                className="text-gray-800 focus:text-gray-400 hover:text-gray-400 dark:text-gray-100"
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <polyline points="15 6 9 12 15 18" />
                </svg>
              </button>
              <button
                aria-label="calendar forward"
                className="ml-3 text-gray-800 focus:text-gray-400 hover:text-gray-400 dark:text-gray-100"
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <polyline points="9 6 15 12 9 18" />
                </svg>
              </button>
            </div>
          </div>

          <div className="pt-6 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d => (
                    <th key={d}>
                      <div className="flex justify-center w-full">
                        <p className="text-base font-medium text-center text-gray-800 dark:text-gray-100">{d}</p>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowindex) => (
                  <tr key={rowindex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="pt-4">
                        <div className="flex flex-col items-center justify-center w-full px-1 py-1">
                          {cell && (
                            <>
                              <button
                                onClick={() => readOnly ? setSelectedDay(cell) : setSelectedDay(cell)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-base font-medium transition-colors ${
                                  cell === selectedDay
                                    ? "bg-purple-600 text-white"
                                    : "text-gray-300 dark:text-gray-100 hover:text-white"
                                }`}
                              >
                                {cell}
                              </button>
                              {tasksByDay[cell]?.length > 0 && (
                                <div className="w-1 h-1 rounded-full bg-purple-400 mt-0.5" />
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Task list with flip cards */}
        <div className="px-5 py-3 rounded-b dark:bg-gray-700 bg-gray-50">
          <div className="px-2 max-h-44 overflow-y-auto">
            {selectedTasks.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
                No tasks for this day.
              </p>
            ) : (
              selectedTasks.map(task => (
                <FlipTaskCard key={task.id} task={task} onUpdate={onUpdate} readOnly={readOnly} />
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
