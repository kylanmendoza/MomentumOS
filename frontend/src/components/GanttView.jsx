import { useMemo, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const PX_PER_MIN = 2;
const MIN_BAR_HEIGHT = 32;
const TIME_COL_W = 60;

const CATEGORY_CONFIG = {
  deep_work: { bar: "rgba(109,40,217,0.55)", border: "#7c3aed", glow: "rgba(124,58,237,0.35)", label: "Deep Work" },
  creative:  { bar: "rgba(139,92,246,0.45)", border: "#8b5cf6", glow: "rgba(139,92,246,0.25)", label: "Creative"  },
  review:    { bar: "rgba(124,58,237,0.35)", border: "#7c3aed", glow: "rgba(124,58,237,0.20)", label: "Review"    },
  break:     { bar: "rgba(8,145,178,0.40)",  border: "#0891b2", glow: "rgba(34,211,238,0.20)", label: "Break"     },
  personal:  { bar: "rgba(6,182,212,0.35)",  border: "#06b6d4", glow: "rgba(34,211,238,0.15)", label: "Personal"  },
  admin:     { bar: "rgba(75,85,99,0.50)",   border: "#4b5563", glow: "rgba(107,114,128,0.15)",label: "Admin"     },
};

const PRIORITY_COLOR = { high: "#f87171", medium: "#fbbf24", low: "#34d399" };

function parseTimeToMin(str) {
  const m = String(str).trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return null;
  let h = parseInt(m[1]);
  const min = parseInt(m[2]);
  const p = m[3].toUpperCase();
  if (p === "PM" && h !== 12) h += 12;
  if (p === "AM" && h === 12) h = 0;
  return h * 60 + min;
}

function parseBlock(timeBlock) {
  if (!timeBlock) return null;
  const parts = timeBlock.split(/\s*[–\-]\s*/);
  if (parts.length < 2) return null;
  const start = parseTimeToMin(parts[0]);
  const end   = parseTimeToMin(parts[1]);
  if (start === null || end === null || end <= start) return null;
  return { start, end, duration: end - start };
}

function toLabel(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const dh = h % 12 || 12;
  return m === 0
    ? `${dh} ${period}`
    : `${dh}:${String(m).padStart(2, "0")}`;
}

export default function GanttView({ tasks = [] }) {
  const nowLineRef = useRef(null);
  const [nowMin, setNowMin] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      setNowMin(d.getHours() * 60 + d.getMinutes());
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const { parsed, earliest, latest, axisMarks, chartH } = useMemo(() => {
    const parsed = tasks
      .map((t) => ({ ...t, _block: parseBlock(t.time_block) }))
      .filter((t) => t._block !== null);

    if (!parsed.length) return { parsed: [], earliest: 0, latest: 0, axisMarks: [], chartH: 0 };

    const earliest = Math.min(...parsed.map((t) => t._block.start));
    const latest   = Math.max(...parsed.map((t) => t._block.end));

    const axisStart = Math.floor(earliest / 30) * 30;
    const axisEnd   = Math.ceil(latest   / 30) * 30;

    const axisMarks = [];
    for (let m = axisStart; m <= axisEnd; m += 30) axisMarks.push(m);

    const chartH = (latest - earliest) * PX_PER_MIN;
    return { parsed, earliest, latest, axisMarks, chartH };
  }, [tasks]);

  if (!parsed.length) {
    return (
      <div className="text-center py-12 text-white/20 text-sm">
        No parseable time blocks — generate a daily plan to see the Gantt view
      </div>
    );
  }

  const nowVisible = nowMin >= earliest && nowMin <= latest;
  const nowTop = (nowMin - earliest) * PX_PER_MIN;

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ background: cfg.bar, border: `1px solid ${cfg.border}` }}
            />
            <span className="text-[10px] text-white/35">{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div
        className="overflow-y-auto rounded-xl"
        style={{ maxHeight: 480, scrollbarWidth: "thin" }}
      >
        <div
          className="relative flex"
          style={{ height: Math.max(chartH + 32, 200) }}
        >
          {/* Time axis */}
          <div
            className="flex-shrink-0 relative select-none"
            style={{ width: TIME_COL_W }}
          >
            {axisMarks.map((mark) => {
              const top = (mark - earliest) * PX_PER_MIN;
              const isHour = mark % 60 === 0;
              return (
                <div
                  key={mark}
                  className="absolute flex items-center justify-end pr-3"
                  style={{ top: top - 8, width: TIME_COL_W, height: 16 }}
                >
                  <span
                    className="text-[10px] leading-none"
                    style={{ color: isHour ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.15)" }}
                  >
                    {toLabel(mark)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Grid + bars */}
          <div className="relative flex-1">
            {/* Horizontal grid lines */}
            {axisMarks.map((mark) => {
              const top = (mark - earliest) * PX_PER_MIN;
              const isHour = mark % 60 === 0;
              return (
                <div
                  key={mark}
                  className="absolute left-0 right-0"
                  style={{
                    top,
                    height: 1,
                    background: isHour
                      ? "rgba(255,255,255,0.07)"
                      : "rgba(255,255,255,0.03)",
                  }}
                />
              );
            })}

            {/* Now indicator */}
            {nowVisible && (
              <div
                ref={nowLineRef}
                className="absolute left-0 right-0 z-20 flex items-center gap-2"
                style={{ top: nowTop }}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    background: "#f87171",
                    boxShadow: "0 0 8px rgba(248,113,113,0.8)",
                    marginLeft: -4,
                  }}
                />
                <div
                  className="flex-1 h-px"
                  style={{
                    background: "rgba(248,113,113,0.6)",
                    boxShadow: "0 0 6px rgba(248,113,113,0.4)",
                  }}
                />
                <span className="text-[9px] text-red-400 pr-2 flex-shrink-0">
                  Now
                </span>
              </div>
            )}

            {/* Task bars */}
            {parsed.map((task, i) => {
              const { start, end, duration } = task._block;
              const top    = (start - earliest) * PX_PER_MIN;
              const height = Math.max(duration * PX_PER_MIN, MIN_BAR_HEIGHT);
              const cfg    = CATEGORY_CONFIG[task.category] || CATEGORY_CONFIG.admin;
              const tall   = height >= 44;

              return (
                <motion.div
                  key={task.id || i}
                  className="absolute left-2 right-3 rounded-lg overflow-hidden cursor-default group"
                  style={{
                    top,
                    height,
                    background: cfg.bar,
                    border: `1px solid ${cfg.border}`,
                    boxShadow: `0 0 12px ${cfg.glow}`,
                  }}
                  initial={{ opacity: 0, scaleY: 0, originY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  transition={{ duration: 0.35, delay: i * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  <div className="px-2.5 py-1.5 h-full flex flex-col justify-center gap-0.5">
                    {/* Top row: time + priority */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono opacity-60 text-white flex-shrink-0">
                        {toLabel(start)}–{toLabel(end)}
                      </span>
                      {task.priority && (
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: PRIORITY_COLOR[task.priority] || PRIORITY_COLOR.medium }}
                        />
                      )}
                    </div>
                    {/* Task label — only if bar is tall enough */}
                    {tall && (
                      <p className="text-xs text-white/85 leading-snug line-clamp-2">
                        {task.task}
                      </p>
                    )}
                  </div>

                  {/* Hover overlay: always shows full task text */}
                  {!tall && (
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10 px-2.5 py-1.5 flex items-center rounded-lg"
                      style={{ background: cfg.bar, backdropFilter: "blur(8px)" }}
                    >
                      <p className="text-xs text-white/90 leading-snug">{task.task}</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
