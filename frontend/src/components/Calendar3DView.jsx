import { useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Text, RoundedBox } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import { updateTask } from "../api/index.js";
import { parseTimeToMin, dayNameToDate, weekNumToDate, monthNameToDate } from "../utils/time.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_3D = {
  deep_work: { color: "#5b21b6", emissive: "#4c1d95", label: "Deep Work" },
  creative:  { color: "#7c3aed", emissive: "#5b21b6", label: "Creative"  },
  review:    { color: "#6d28d9", emissive: "#4c1d95", label: "Review"    },
  break:     { color: "#0e7490", emissive: "#155e75", label: "Break"     },
  personal:  { color: "#0891b2", emissive: "#0e7490", label: "Personal"  },
  admin:     { color: "#4b5563", emissive: "#1f2937", label: "Admin"     },
};

const CATEGORY_BG = {
  deep_work: "rgba(109,40,217,0.75)", creative: "rgba(139,92,246,0.65)",
  review: "rgba(124,58,237,0.55)",   break: "rgba(8,145,178,0.60)",
  personal: "rgba(6,182,212,0.55)",  admin: "rgba(75,85,99,0.70)",
};

const PRIORITY_COLOR = { high: "#f87171", medium: "#fbbf24", low: "#34d399" };
const CATEGORIES = Object.entries(CATEGORY_3D).map(([value, { label }]) => ({ value, label }));
const PRIORITIES  = [{ value: "high", label: "High" }, { value: "medium", label: "Medium" }, { value: "low", label: "Low" }];
const DAY_ABBR    = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_ABB  = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

// Board + grid geometry constants
const BOARD_W  = 13.8;
const BOARD_H  = 10.8;
const COL_W    = 1.72;
const ROW_H    = 1.62;
const DISC_R   = 0.58;
const DISC_T   = 0.26;
const GRID_TOP = 2.9;
const EMPTY_COLOR   = "#111128";
const EMPTY_EMISSIVE = "#080815";

function lerp(a, b, t) { return a + (b - a) * t; }
function colX(col, cols = 7) { return (col - (cols - 1) / 2) * COL_W; }
function rowY(row) { return GRID_TOP - row * ROW_H; }

function stripDayPrefix(str) {
  return (str || "")
    .replace(/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s*:?\s*/i, "")
    .trim();
}

function parseDailyTime(tb) {
  if (!tb) return null;
  const parts = tb.split(/\s*[-–]\s*/);
  if (parts.length < 2) return null;
  const s = parseTimeToMin(parts[0].trim());
  const e = parseTimeToMin(parts[1].trim());
  if (s === null || e === null) return null;
  return { startMin: s, endMin: e <= s ? s + 60 : e };
}

// ─── Calendar board (the physical panel) ─────────────────────────────────────

function CalendarBoard({ children }) {
  return (
    <group rotation={[-0.14, 0, 0]}>
      {/* Glow border layer */}
      <RoundedBox args={[BOARD_W + 0.14, BOARD_H + 0.14, 0.26]} radius={0.5} smoothness={6}>
        <meshStandardMaterial color="#7c3aed" transparent opacity={0.18} emissive="#7c3aed" emissiveIntensity={0.4} />
      </RoundedBox>
      {/* Main dark panel */}
      <RoundedBox args={[BOARD_W, BOARD_H, 0.3]} radius={0.46} smoothness={6}>
        <meshStandardMaterial color="#08080f" metalness={0.05} roughness={0.9} />
      </RoundedBox>
      {/* Subtle grid lines (horizontal separators) */}
      {[0,1,2,3,4].map((r) => (
        <mesh key={r} position={[0, rowY(r) - ROW_H / 2, 0.17]}>
          <planeGeometry args={[BOARD_W - 1.2, 0.012]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.04} />
        </mesh>
      ))}
      {children}
    </group>
  );
}

// ─── Day column headers ───────────────────────────────────────────────────────

function DayHeaders({ days = DAY_ABBR }) {
  return (
    <>
      {days.map((d, i) => (
        <Text
          key={d}
          position={[colX(i, days.length), GRID_TOP + 0.82, 0.22]}
          fontSize={0.21}
          color="#a78bfa"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {d}
        </Text>
      ))}
    </>
  );
}

// ─── Disc (the circular raised button) ───────────────────────────────────────

function Disc({ position, color, emissive, label, sublabel, onClick, disabled }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const active = !disabled && !!onClick;

  useFrame(() => {
    if (!meshRef.current) return;
    const targetZ = hovered && active ? 0.45 : 0;
    meshRef.current.position.z = lerp(meshRef.current.position.z, targetZ, 0.14);
    meshRef.current.material.emissiveIntensity = lerp(
      meshRef.current.material.emissiveIntensity,
      hovered && active ? 0.55 : disabled ? 0.05 : 0.18,
      0.14
    );
  });

  return (
    <group
      position={position}
      onClick={(e) => { e.stopPropagation(); active && onClick?.(); }}
      onPointerOver={(e) => { e.stopPropagation(); if (active) { setHovered(true); document.body.style.cursor = "pointer"; } }}
      onPointerOut={(e)  => { e.stopPropagation(); setHovered(false); document.body.style.cursor = "default"; }}
    >
      {/* Disc geometry — cylinder rotated to face camera */}
      <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.22]}>
        <cylinderGeometry args={[DISC_R, DISC_R, DISC_T, 48]} />
        <meshStandardMaterial
          color={color || EMPTY_COLOR}
          emissive={emissive || EMPTY_EMISSIVE}
          emissiveIntensity={0.18}
          metalness={0.08}
          roughness={0.75}
        />
      </mesh>
      {/* Primary label */}
      {label && (
        <Text position={[0, sublabel ? 0.1 : 0, 0.38]} fontSize={0.2} color="rgba(255,255,255,0.9)" anchorX="center" anchorY="middle" fontWeight="bold">
          {label}
        </Text>
      )}
      {/* Sub-label (task count or time) */}
      {sublabel && (
        <Text position={[0, -0.14, 0.38]} fontSize={0.13} color="rgba(255,255,255,0.45)" anchorX="center" anchorY="middle">
          {sublabel}
        </Text>
      )}
    </group>
  );
}

// ─── Monthly calendar ─────────────────────────────────────────────────────────

function getMonthGrid(year, month) {
  const firstDayJS = new Date(year, month, 1).getDay();       // 0=Sun
  const offset     = (firstDayJS + 6) % 7;                    // convert to Mon-based
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function weekNumForDay(day) {
  if (day <= 7)  return "Week 1";
  if (day <= 14) return "Week 2";
  if (day <= 21) return "Week 3";
  return "Week 4";
}

function MonthCalendar({ plan, onSelect }) {
  const ref   = plan?.created_at ? new Date(plan.created_at) : new Date();
  const year  = ref.getFullYear();
  const month = ref.getMonth();

  const tasksByWeek = useMemo(() => {
    const map = { "Week 1": [], "Week 2": [], "Week 3": [], "Week 4": [] };
    (plan?.tasks ?? []).forEach((t) => {
      const m = t.time_block?.match(/week\s*(\d+)/i);
      const key = m ? `Week ${m[1]}` : "Week 1";
      if (map[key]) map[key].push(t);
    });
    return map;
  }, [plan?.tasks]);

  const cells = useMemo(() => getMonthGrid(year, month), [year, month]);
  const today = new Date().getDate();
  const isCurrentMonth =
    new Date().getFullYear() === year && new Date().getMonth() === month;

  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  return (
    <CalendarBoard>
      {/* Month + year title */}
      <Text position={[0, GRID_TOP + 1.7, 0.22]} fontSize={0.3} color="rgba(255,255,255,0.6)" anchorX="center" anchorY="middle">
        {MONTHS_FULL[month].toUpperCase()}  {year}
      </Text>

      <DayHeaders />

      {rows.map((row, ri) =>
        row.map((day, ci) => {
          if (!day) return null;
          const weekKey  = weekNumForDay(day);
          const tasks    = tasksByWeek[weekKey] || [];
          const primary  = tasks[0];
          const cfg      = primary ? (CATEGORY_3D[primary.category] || CATEGORY_3D.admin) : null;
          const isToday  = isCurrentMonth && day === today;

          return (
            <group key={`${ri}-${ci}`}>
              {isToday && (
                <mesh position={[colX(ci), rowY(ri), 0.19]}>
                  <ringGeometry args={[DISC_R + 0.02, DISC_R + 0.1, 48]} />
                  <meshStandardMaterial color="#f87171" emissive="#f87171" emissiveIntensity={0.9} transparent opacity={0.7} />
                </mesh>
              )}
              <Disc
                position={[colX(ci), rowY(ri), 0]}
                color={cfg?.color}
                emissive={cfg?.emissive}
                label={String(day)}
                sublabel={tasks.length > 0 ? `${tasks.length} task${tasks.length > 1 ? "s" : ""}` : null}
                onClick={tasks.length ? () => onSelect(primary, tasks) : null}
                disabled={!tasks.length}
              />
            </group>
          );
        })
      )}
    </CalendarBoard>
  );
}

// ─── Weekly calendar ──────────────────────────────────────────────────────────

function WeekCalendar({ plan, onSelect }) {
  const tasksByDay = useMemo(() => {
    const map = {};
    DAY_ABBR.forEach((d) => { map[d] = []; });
    (plan?.tasks ?? []).forEach((t) => {
      const m = t.time_block?.match(/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
      if (m) {
        const abbr = m[1].slice(0, 3).toUpperCase();
        if (map[abbr]) map[abbr].push(t);
      }
    });
    return map;
  }, [plan?.tasks]);

  const maxRows = Math.max(1, ...Object.values(tasksByDay).map((a) => a.length));

  return (
    <CalendarBoard>
      <DayHeaders />
      {DAY_ABBR.map((day, ci) => {
        const tasks = tasksByDay[day] || [];
        if (!tasks.length) {
          return (
            <Disc
              key={day}
              position={[colX(ci), rowY(0), 0]}
              label="—"
              disabled
            />
          );
        }
        return tasks.slice(0, 5).map((task, ri) => {
          const cfg = CATEGORY_3D[task.category] || CATEGORY_3D.admin;
          const parsed = parseDailyTime(stripDayPrefix(task.time_block));
          const timeLabel = parsed
            ? `${Math.floor(parsed.startMin / 60) % 12 || 12}:${String(parsed.startMin % 60).padStart(2, "0")} ${parsed.startMin >= 720 ? "PM" : "AM"}`
            : null;

          return (
            <Disc
              key={task.id}
              position={[colX(ci), rowY(ri), 0]}
              color={cfg.color}
              emissive={cfg.emissive}
              label={timeLabel || task.task.slice(0, 6)}
              sublabel={timeLabel ? task.task.slice(0, 8) + (task.task.length > 8 ? "…" : "") : null}
              onClick={() => onSelect(task, [task])}
            />
          );
        });
      })}
    </CalendarBoard>
  );
}

// ─── Daily calendar ───────────────────────────────────────────────────────────

const HOUR_START = 6;
const Y_PER_HOUR = 0.9;

function DayCalendar({ plan, onSelect }) {
  const tasks = plan?.tasks ?? [];
  const now   = new Date();
  const today = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const blocks = useMemo(() => tasks.map((t) => {
    const p = parseDailyTime(t.time_block);
    if (!p) return null;
    const height  = Math.max(0.32, ((p.endMin - p.startMin) / 60) * Y_PER_HOUR);
    const yCenter = -((p.startMin / 60) - HOUR_START) * Y_PER_HOUR + GRID_TOP - 0.5;
    return { task: t, height, yCenter };
  }).filter(Boolean), [tasks]);

  const nowY = -((now.getHours() + now.getMinutes() / 60) - HOUR_START) * Y_PER_HOUR + GRID_TOP - 0.5;

  return (
    <CalendarBoard>
      {/* Date title */}
      <Text position={[0, GRID_TOP + 1.7, 0.22]} fontSize={0.24} color="rgba(255,255,255,0.6)" anchorX="center" anchorY="middle">
        {today.toUpperCase()}
      </Text>

      {/* Hour tick marks */}
      {Array.from({ length: 17 }, (_, i) => {
        const hour  = HOUR_START + i;
        const y     = -i * Y_PER_HOUR + GRID_TOP - 0.5;
        const label = hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
        return (
          <group key={hour} position={[0, y, 0.18]}>
            <mesh>
              <planeGeometry args={[BOARD_W - 1, 0.012]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.04} />
            </mesh>
            <Text position={[-5.8, 0, 0.06]} fontSize={0.17} color="rgba(255,255,255,0.22)" anchorX="right" anchorY="middle">
              {label}
            </Text>
          </group>
        );
      })}

      {/* Now indicator */}
      <NowLine y={nowY} />

      {/* Task bars */}
      {blocks.map(({ task, height, yCenter }) => {
        const cfg = CATEGORY_3D[task.category] || CATEGORY_3D.admin;
        return (
          <TaskBar
            key={task.id}
            task={task}
            position={[1, yCenter, 0]}
            width={10.2}
            height={height}
            cfg={cfg}
            onSelect={() => onSelect(task, [task])}
          />
        );
      })}
    </CalendarBoard>
  );
}

function NowLine({ y }) {
  const meshRef = useRef();
  useFrame(({ clock }) => {
    if (meshRef.current) meshRef.current.material.opacity = 0.45 + Math.sin(clock.elapsedTime * 3) * 0.4;
  });
  return (
    <mesh ref={meshRef} position={[0.5, y, 0.24]}>
      <planeGeometry args={[11.5, 0.045]} />
      <meshStandardMaterial color="#f87171" emissive="#f87171" emissiveIntensity={1} transparent opacity={0.7} />
    </mesh>
  );
}

function TaskBar({ task, position, width, height, cfg, onSelect }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.position.z = lerp(meshRef.current.position.z, hovered ? 0.38 : 0.22, 0.14);
    meshRef.current.material.emissiveIntensity = lerp(
      meshRef.current.material.emissiveIntensity, hovered ? 0.55 : 0.2, 0.14
    );
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        position={[0, 0, 0.22]}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={(e)  => { e.stopPropagation(); setHovered(false); document.body.style.cursor = "default"; }}
      >
        <boxGeometry args={[width, Math.max(height - 0.06, 0.18), 0.22]} />
        <meshStandardMaterial color={cfg.color} emissive={cfg.emissive} emissiveIntensity={0.2} transparent opacity={0.92} />
      </mesh>
      {/* Priority dot */}
      <mesh position={[width / 2 - 0.22, 0, 0.38]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color={PRIORITY_COLOR[task.priority] || PRIORITY_COLOR.medium} emissive={PRIORITY_COLOR[task.priority] || PRIORITY_COLOR.medium} emissiveIntensity={1} />
      </mesh>
      <Text position={[0, 0, 0.38]} fontSize={0.17} maxWidth={width - 0.5} color="rgba(255,255,255,0.88)" anchorX="center" anchorY="middle" overflowWrap="break-word" textAlign="center">
        {task.task.length > 50 ? task.task.slice(0, 48) + "…" : task.task}
      </Text>
    </group>
  );
}

// ─── Yearly calendar ──────────────────────────────────────────────────────────

function YearCalendar({ plan, onSelect }) {
  const tasksByMonth = useMemo(() => {
    const map = {};
    MONTHS_FULL.forEach((m) => { map[m] = []; });
    (plan?.tasks ?? []).forEach((t) => {
      const m = t.time_block?.match(
        /january|february|march|april|may|june|july|august|september|october|november|december/i
      );
      if (m) {
        const key = m[0].charAt(0).toUpperCase() + m[0].slice(1).toLowerCase();
        if (map[key]) map[key].push(t);
      }
    });
    return map;
  }, [plan?.tasks]);

  return (
    <group rotation={[-0.14, 0, 0]}>
      {/* Glow border */}
      <RoundedBox args={[BOARD_W + 0.14, BOARD_H + 0.14, 0.26]} radius={0.5} smoothness={6}>
        <meshStandardMaterial color="#7c3aed" transparent opacity={0.18} emissive="#7c3aed" emissiveIntensity={0.4} />
      </RoundedBox>
      {/* Panel */}
      <RoundedBox args={[BOARD_W, BOARD_H, 0.3]} radius={0.46} smoothness={6}>
        <meshStandardMaterial color="#08080f" roughness={0.9} />
      </RoundedBox>

      <Text position={[0, GRID_TOP + 1.7, 0.22]} fontSize={0.3} color="rgba(255,255,255,0.6)" anchorX="center" anchorY="middle">
        {new Date(plan?.created_at || Date.now()).getFullYear()}
      </Text>

      {/* 4 cols × 3 rows grid of month discs */}
      {MONTHS_FULL.map((month, mi) => {
        const col     = mi % 4;
        const row     = Math.floor(mi / 4);
        const tasks   = tasksByMonth[month] || [];
        const primary = tasks[0];
        const cfg     = primary ? (CATEGORY_3D[primary.category] || CATEGORY_3D.admin) : null;
        const x       = (col - 1.5) * 3.2;
        const y       = GRID_TOP - 0.4 - row * 3.2;

        return (
          <Disc
            key={month}
            position={[x, y, 0]}
            color={cfg?.color}
            emissive={cfg?.emissive}
            label={MONTHS_ABB[mi]}
            sublabel={tasks.length ? `${tasks.length}` : null}
            onClick={tasks.length ? () => onSelect(primary, tasks) : null}
            disabled={!tasks.length}
          />
        );
      })}
    </group>
  );
}

// ─── Scene router ─────────────────────────────────────────────────────────────

function ScheduleScene({ plan, onSelect }) {
  const type = plan?.schedule_type || "daily";
  if (type === "daily")   return <DayCalendar   plan={plan} onSelect={onSelect} />;
  if (type === "weekly")  return <WeekCalendar  plan={plan} onSelect={onSelect} />;
  if (type === "monthly") return <MonthCalendar plan={plan} onSelect={onSelect} />;
  if (type === "yearly")  return <YearCalendar  plan={plan} onSelect={onSelect} />;
  return null;
}

// ─── Flip-card modal ──────────────────────────────────────────────────────────

function FlipCardModal({ editTask, allTasks, onClose, onUpdate }) {
  const [flipped,   setFlipped]  = useState(false);
  const [taskIndex, setIndex]    = useState(0);
  const [form,      setForm]     = useState({});
  const [saving,    setSaving]   = useState(false);

  useMemo(() => {
    if (editTask) {
      setFlipped(false);
      setIndex(0);
      setForm({ task: editTask.task, category: editTask.category || "deep_work", priority: editTask.priority || "medium" });
    }
  }, [editTask?.id]);

  const tasks   = allTasks || (editTask ? [editTask] : []);
  const current = tasks[taskIndex] || editTask;
  const cfg     = CATEGORY_3D[current?.category] || CATEGORY_3D.admin;

  async function handleSave() {
    if (!current) return;
    setSaving(true);
    try {
      await updateTask(current.id, form);
      onUpdate?.();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {editTask && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <div style={{ perspective: "1200px", width: 380, height: tasks.length > 1 ? 340 : 300 }}>
            <motion.div
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
              style={{ width: "100%", height: "100%", position: "relative", transformStyle: "preserve-3d" }}
            >
              {/* Front */}
              <div
                className="absolute inset-0 flex flex-col p-6 rounded-2xl"
                style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", background: "#12121f", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 64px rgba(0,0,0,0.65)" }}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-medium" style={{ background: CATEGORY_BG[current?.category] || CATEGORY_BG.admin, border: `1px solid ${cfg.color}`, color: "#fff" }}>
                    {cfg.label}
                  </span>
                  <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <p className="flex-1 text-sm leading-relaxed text-white/85">{current?.task}</p>
                <p className="text-[11px] text-white/30 mt-1">{current?.time_block}</p>

                {/* Multi-task navigation */}
                {tasks.length > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <button onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={taskIndex === 0} className="px-2 py-0.5 text-xs rounded text-white/40 hover:text-white/70 disabled:opacity-20">←</button>
                    <span className="text-[10px] text-white/30">{taskIndex + 1} / {tasks.length}</span>
                    <button onClick={() => setIndex((i) => Math.min(tasks.length - 1, i + 1))} disabled={taskIndex === tasks.length - 1} className="px-2 py-0.5 text-xs rounded text-white/40 hover:text-white/70 disabled:opacity-20">→</button>
                  </div>
                )}

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: PRIORITY_COLOR[current?.priority] || PRIORITY_COLOR.medium }} />
                    <span className="text-xs capitalize text-white/35">{current?.priority || "medium"} priority</span>
                  </div>
                  <button onClick={() => { setForm({ task: current.task, category: current.category || "deep_work", priority: current.priority || "medium" }); setFlipped(true); }} className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.35)" }}>
                    Edit
                  </button>
                </div>
              </div>

              {/* Back */}
              <div
                className="absolute inset-0 flex flex-col p-6 rounded-2xl"
                style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "#12121f", border: "1px solid rgba(124,58,237,0.3)", boxShadow: "0 24px 64px rgba(0,0,0,0.65)" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-medium tracking-widest uppercase text-white/40">Edit Task</span>
                  <button onClick={() => setFlipped(false)} className="text-white/30 hover:text-white/70 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                </div>
                <input
                  type="text"
                  value={form.task || ""}
                  onChange={(e) => setForm((f) => ({ ...f, task: e.target.value }))}
                  className="w-full px-3 py-2 mb-3 text-sm rounded-lg focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" }}
                  placeholder="Task name"
                />
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <select value={form.category || "deep_work"} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="px-2 py-2 text-xs rounded-lg focus:outline-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
                    {CATEGORIES.map(({ value, label }) => <option key={value} value={value} style={{ background: "#12121f" }}>{label}</option>)}
                  </select>
                  <select value={form.priority || "medium"} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} className="px-2 py-2 text-xs rounded-lg focus:outline-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
                    {PRIORITIES.map(({ value, label }) => <option key={value} value={value} style={{ background: "#12121f" }}>{label}</option>)}
                  </select>
                </div>
                <div className="flex gap-2 mt-auto">
                  <button onClick={() => setFlipped(false)} className="flex-1 py-2 text-xs rounded-lg" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>Cancel</button>
                  <button onClick={handleSave} disabled={saving} className="flex-1 py-2 text-xs font-medium rounded-lg" style={{ background: saving ? "rgba(124,58,237,0.25)" : "linear-gradient(135deg,#7c3aed,#6d28d9)", color: "#fff", boxShadow: saving ? "none" : "0 0 16px rgba(124,58,237,0.4)", opacity: saving ? 0.6 : 1 }}>
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="absolute top-3 left-3 flex flex-wrap gap-x-3 gap-y-1.5 pointer-events-none">
      {Object.entries(CATEGORY_3D).map(([key, { color, label }]) => (
        <div key={key} className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
          <span className="text-[10px] text-white/35">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Camera presets ───────────────────────────────────────────────────────────

const CAMERA = {
  daily:   { position: [0, 0, 16], fov: 52 },
  weekly:  { position: [0, 1, 16], fov: 56 },
  monthly: { position: [0, 0, 15], fov: 54 },
  yearly:  { position: [0, 0, 17], fov: 54 },
};

// ─── Main export ──────────────────────────────────────────────────────────────

export default function Calendar3DView({ plan, onUpdate }) {
  const [editTask,  setEditTask]  = useState(null);
  const [allTasks,  setAllTasks]  = useState([]);
  const type   = plan?.schedule_type || "daily";
  const camera = CAMERA[type] || CAMERA.daily;

  function handleSelect(task, tasks) {
    setEditTask(task);
    setAllTasks(tasks || [task]);
  }

  return (
    <div style={{ height: 560, position: "relative" }}>
      <Legend />
      <Canvas camera={{ position: camera.position, fov: camera.fov }} style={{ borderRadius: 12 }} gl={{ antialias: true }}>
        <color attach="background" args={["#06060f"]} />
        <fog attach="fog" args={["#06060f", 22, 60]} />
        <ambientLight intensity={0.4} />
        <pointLight position={[0,  12, 12]} intensity={1.4} color="#ffffff" />
        <pointLight position={[-6,  4,  8]} intensity={0.6} color="#a78bfa" />
        <pointLight position={[ 6, -4,  8]} intensity={0.4} color="#22d3ee" />
        <Stars radius={80} depth={50} count={3000} factor={3} fade />
        <OrbitControls enablePan={false} enableDamping dampingFactor={0.08} maxPolarAngle={Math.PI * 0.7} minDistance={6} maxDistance={35} />
        <ScheduleScene plan={plan} onSelect={handleSelect} />
      </Canvas>
      <FlipCardModal
        editTask={editTask}
        allTasks={allTasks}
        onClose={() => { setEditTask(null); setAllTasks([]); }}
        onUpdate={onUpdate}
      />
    </div>
  );
}
