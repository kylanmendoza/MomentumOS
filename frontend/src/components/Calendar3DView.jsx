import { useRef, useState, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Text, Float } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { updateTask } from "../api/index.js";
import {
  parseTimeToMin,
  datesToTimeBlock,
  dayNameToDate,
  weekNumToDate,
  monthNameToDate,
} from "../utils/time.js";

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
  deep_work: "rgba(109,40,217,0.75)",
  creative:  "rgba(139,92,246,0.65)",
  review:    "rgba(124,58,237,0.55)",
  break:     "rgba(8,145,178,0.60)",
  personal:  "rgba(6,182,212,0.55)",
  admin:     "rgba(75,85,99,0.70)",
};

const PRIORITY_COLOR  = { high: "#f87171", medium: "#fbbf24", low: "#34d399" };
const CATEGORIES = Object.entries(CATEGORY_3D).map(([value, { label }]) => ({ value, label }));
const PRIORITIES  = [
  { value: "high",   label: "High"   },
  { value: "medium", label: "Medium" },
  { value: "low",    label: "Low"    },
];

const DAY_ORDER = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function lerp(a, b, t) { return a + (b - a) * t; }

function stripDayPrefix(str) {
  return (str || "")
    .replace(/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s*:?\s*/i, "")
    .trim();
}

function parseDailyTimeBlock(timeBlock) {
  if (!timeBlock) return null;
  const parts = timeBlock.split(/\s*[-–]\s*/);
  if (parts.length < 2) return null;
  const startMin = parseTimeToMin(parts[0].trim());
  const endMin   = parseTimeToMin(parts[1].trim());
  if (startMin === null || endMin === null) return null;
  return { startMin, endMin: endMin <= startMin ? startMin + 60 : endMin };
}

// ─── Shared: TaskBlock3D ──────────────────────────────────────────────────────

function TaskBlock3D({ task, position, width = 2.4, height = 1, onSelect, baseZ = 0 }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const cfg = CATEGORY_3D[task.category] || CATEGORY_3D.admin;

  useFrame(() => {
    if (!meshRef.current) return;
    const targetZ = hovered ? baseZ + 0.5 : baseZ;
    meshRef.current.position.z = lerp(meshRef.current.position.z, targetZ, 0.12);
    meshRef.current.material.emissiveIntensity = lerp(
      meshRef.current.material.emissiveIntensity,
      hovered ? 0.6 : 0.18,
      0.12
    );
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        position={[0, 0, baseZ]}
        onClick={(e) => { e.stopPropagation(); onSelect(task); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true);  document.body.style.cursor = "pointer"; }}
        onPointerOut={(e)  => { e.stopPropagation(); setHovered(false); document.body.style.cursor = "default"; }}
      >
        <boxGeometry args={[width, height, 0.28]} />
        <meshStandardMaterial
          color={cfg.color}
          emissive={cfg.emissive}
          emissiveIntensity={0.18}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* Priority dot */}
      <mesh position={[width / 2 - 0.18, height / 2 - 0.18, baseZ + 0.22]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial
          color={PRIORITY_COLOR[task.priority] || PRIORITY_COLOR.medium}
          emissive={PRIORITY_COLOR[task.priority] || PRIORITY_COLOR.medium}
          emissiveIntensity={1}
        />
      </mesh>
      {/* Label */}
      <Text
        position={[0, 0, baseZ + 0.22]}
        fontSize={Math.min(0.15, width * 0.07)}
        maxWidth={width - 0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
        overflowWrap="break-word"
        textAlign="center"
        fillOpacity={0.9}
      >
        {task.task.length > 40 ? task.task.slice(0, 38) + "…" : task.task}
      </Text>
    </group>
  );
}

// ─── DayTimeline (daily) ──────────────────────────────────────────────────────

const HOUR_START = 6;   // 6 AM
const HOUR_END   = 23;  // 11 PM
const Y_PER_HOUR = 1.1;

function hourToY(minutes) {
  return -((minutes / 60) - HOUR_START) * Y_PER_HOUR;
}

function NowIndicator() {
  const meshRef = useRef();
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    meshRef.current.material.opacity = 0.5 + Math.sin(clock.elapsedTime * 3) * 0.4;
  });
  const now = new Date();
  const y   = hourToY(now.getHours() * 60 + now.getMinutes());

  return (
    <mesh ref={meshRef} position={[0, y, 0.1]}>
      <planeGeometry args={[3.6, 0.04]} />
      <meshStandardMaterial color="#f87171" emissive="#f87171" emissiveIntensity={1} transparent opacity={0.8} />
    </mesh>
  );
}

function DayTimeline({ plan, onSelect }) {
  const tasks = plan?.tasks ?? [];

  const blocks = useMemo(() => tasks.map((task) => {
    const parsed = parseDailyTimeBlock(task.time_block);
    if (!parsed) return null;
    const { startMin, endMin } = parsed;
    const height  = Math.max(0.35, ((endMin - startMin) / 60) * Y_PER_HOUR);
    const yCenter = hourToY(startMin) - height / 2;
    return { task, height, yCenter };
  }).filter(Boolean), [tasks]);

  return (
    <group position={[-1.5, 0, 0]}>
      {/* Y-axis rail */}
      <mesh position={[-1.5, -(((HOUR_END - HOUR_START) / 2) * Y_PER_HOUR), 0]}>
        <boxGeometry args={[0.03, (HOUR_END - HOUR_START) * Y_PER_HOUR, 0.03]} />
        <meshStandardMaterial color="#a78bfa" transparent opacity={0.25} />
      </mesh>

      {/* Hour ticks + labels */}
      {Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => {
        const hour = HOUR_START + i;
        const y    = hourToY(hour * 60);
        const label = hour === 12 ? "12 PM"
          : hour > 12 ? `${hour - 12} PM`
          : hour === 0 ? "12 AM"
          : `${hour} AM`;
        return (
          <group key={hour} position={[0, y, 0]}>
            <mesh position={[-1.5, 0, 0]}>
              <boxGeometry args={[0.18, 0.02, 0.02]} />
              <meshStandardMaterial color="#a78bfa" transparent opacity={0.3} />
            </mesh>
            <Text
              position={[-2.05, 0, 0]}
              fontSize={0.17}
              color="rgba(255,255,255,0.3)"
              anchorX="right"
              anchorY="middle"
            >
              {label}
            </Text>
            {/* Dashed grid line */}
            <mesh position={[0.6, 0, -0.05]}>
              <planeGeometry args={[3.6, 0.01]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.05} />
            </mesh>
          </group>
        );
      })}

      {/* Task blocks */}
      {blocks.map(({ task, height, yCenter }) => (
        <TaskBlock3D
          key={task.id}
          task={task}
          position={[1.8, yCenter, 0]}
          width={2.6}
          height={height}
          onSelect={onSelect}
        />
      ))}

      <NowIndicator />
    </group>
  );
}

// ─── WeekGrid (weekly) ────────────────────────────────────────────────────────

function WeekGrid({ plan, onSelect }) {
  const tasks  = plan?.tasks ?? [];
  const ref    = plan?.created_at;

  const byDay = useMemo(() => {
    const map = {};
    tasks.forEach((task) => {
      const dayMatch = task.time_block?.match(
        /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i
      );
      const day = dayMatch ? dayMatch[1].charAt(0).toUpperCase() + dayMatch[1].slice(1).toLowerCase() : null;
      if (day) {
        if (!map[day]) map[day] = [];
        map[day].push(task);
      }
    });
    return map;
  }, [tasks]);

  const days = DAY_ORDER.filter((d) => byDay[d] || true).slice(0, 7);

  return (
    <group>
      {days.map((day, i) => {
        const x    = i * 3.5 - 10.5;
        const z    = Math.sin((i - 3) * 0.3) * -1.8;
        const dayTasks = byDay[day] || [];

        return (
          <group key={day} position={[x, 0, z]}>
            {/* Column backdrop */}
            <mesh position={[0, -3, -0.15]}>
              <planeGeometry args={[2.8, 10]} />
              <meshStandardMaterial color="#7c3aed" transparent opacity={0.04} />
            </mesh>

            {/* Day label */}
            <Text
              position={[0, 2.8, 0]}
              fontSize={0.22}
              color="rgba(167,139,250,0.75)"
              anchorX="center"
              anchorY="middle"
              fontWeight="bold"
            >
              {day.slice(0, 3).toUpperCase()}
            </Text>

            {/* Tasks */}
            {dayTasks.map((task, ti) => {
              const stripped = stripDayPrefix(task.time_block);
              const parsed   = parseDailyTimeBlock(stripped);
              const yPos     = parsed
                ? hourToY(parsed.startMin) - (Math.max(0.35, ((parsed.endMin - parsed.startMin) / 60) * Y_PER_HOUR)) / 2
                : 1.8 - ti * 1.4;
              const height = parsed
                ? Math.max(0.35, ((parsed.endMin - parsed.startMin) / 60) * Y_PER_HOUR)
                : 1.1;
              return (
                <TaskBlock3D
                  key={task.id}
                  task={task}
                  position={[0, yPos, 0]}
                  width={2.4}
                  height={height}
                  onSelect={onSelect}
                />
              );
            })}

            {/* Empty day indicator */}
            {dayTasks.length === 0 && (
              <Text
                position={[0, 0, 0]}
                fontSize={0.14}
                color="rgba(255,255,255,0.12)"
                anchorX="center"
                anchorY="middle"
              >
                no tasks
              </Text>
            )}
          </group>
        );
      })}
    </group>
  );
}

// ─── MonthGrid (monthly) ──────────────────────────────────────────────────────

function MonthGrid({ plan, onSelect }) {
  const tasks = plan?.tasks ?? [];

  const byWeek = useMemo(() => {
    const map = { "Week 1": [], "Week 2": [], "Week 3": [], "Week 4": [] };
    tasks.forEach((task) => {
      const match = task.time_block?.match(/week\s*(\d+)/i);
      if (match) {
        const key = `Week ${match[1]}`;
        if (map[key]) map[key].push(task);
        else map["Week 1"].push(task);
      } else {
        map["Week 1"].push(task);
      }
    });
    return map;
  }, [tasks]);

  const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"];

  return (
    <group>
      {weeks.map((week, wi) => {
        const y         = 4.5 - wi * 3.2;
        const weekTasks = byWeek[week] || [];

        return (
          <group key={week} position={[0, y, 0]}>
            {/* Panel */}
            <mesh position={[0, 0, -0.2]}>
              <planeGeometry args={[18, 2.4]} />
              <meshStandardMaterial color="#7c3aed" transparent opacity={0.06} />
            </mesh>

            {/* Week label */}
            <Text
              position={[-8.2, 0, 0]}
              fontSize={0.2}
              color="rgba(167,139,250,0.5)"
              anchorX="left"
              anchorY="middle"
            >
              {week.toUpperCase()}
            </Text>

            {/* Task cards */}
            {weekTasks.slice(0, 7).map((task, ti) => (
              <TaskBlock3D
                key={task.id}
                task={task}
                position={[-6 + ti * 2.2, 0, 0]}
                width={1.9}
                height={1.8}
                onSelect={onSelect}
              />
            ))}
          </group>
        );
      })}
    </group>
  );
}

// ─── YearWheel (yearly) ───────────────────────────────────────────────────────

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function YearWheel({ plan, onSelect }) {
  const tasks = plan?.tasks ?? [];

  const byMonth = useMemo(() => {
    const map = {};
    MONTHS.forEach((m) => { map[m] = []; });
    tasks.forEach((task) => {
      const match = task.time_block?.match(
        /january|february|march|april|may|june|july|august|september|october|november|december/i
      );
      if (match) {
        const key = match[0].charAt(0).toUpperCase() + match[0].slice(1).toLowerCase();
        if (map[key]) map[key].push(task);
      }
    });
    return map;
  }, [tasks]);

  return (
    <group>
      {MONTHS.map((month, mi) => {
        const angle = (mi / 12) * Math.PI * 2 - Math.PI / 2;
        const r     = 7.5;
        const x     = Math.cos(angle) * r;
        const z     = Math.sin(angle) * r;
        const monthTasks = byMonth[month] || [];

        return (
          <Float key={month} speed={1.2} rotationIntensity={0} floatIntensity={0.3}>
            <group position={[x, 0, z]} rotation={[0, -angle + Math.PI / 2, 0]}>
              {/* Card background */}
              <mesh position={[0, 0, -0.1]}>
                <planeGeometry args={[2.6, 3.2]} />
                <meshStandardMaterial color="#7c3aed" transparent opacity={0.1} />
              </mesh>

              {/* Month label */}
              <Text
                position={[0, 1.2, 0]}
                fontSize={0.22}
                color="rgba(167,139,250,0.8)"
                anchorX="center"
                anchorY="middle"
                fontWeight="bold"
              >
                {month.slice(0, 3).toUpperCase()}
              </Text>

              {/* Task count badge */}
              <Text
                position={[0, 0.7, 0]}
                fontSize={0.14}
                color="rgba(255,255,255,0.3)"
                anchorX="center"
                anchorY="middle"
              >
                {monthTasks.length} tasks
              </Text>

              {/* First 2 tasks visible */}
              {monthTasks.slice(0, 2).map((task, ti) => (
                <TaskBlock3D
                  key={task.id}
                  task={task}
                  position={[0, -0.1 - ti * 1.3, 0]}
                  width={2.2}
                  height={1.1}
                  onSelect={onSelect}
                />
              ))}
            </group>
          </Float>
        );
      })}
    </group>
  );
}

// ─── Scene router ─────────────────────────────────────────────────────────────

function ScheduleScene({ plan, onSelect }) {
  const type = plan?.schedule_type || "daily";
  if (type === "daily")   return <DayTimeline plan={plan} onSelect={onSelect} />;
  if (type === "weekly")  return <WeekGrid    plan={plan} onSelect={onSelect} />;
  if (type === "monthly") return <MonthGrid   plan={plan} onSelect={onSelect} />;
  if (type === "yearly")  return <YearWheel   plan={plan} onSelect={onSelect} />;
  return null;
}

// ─── Flip-card modal ──────────────────────────────────────────────────────────

function FlipCardModal({ editTask, onClose, onUpdate }) {
  const [flipped, setFlipped] = useState(false);
  const [form,    setForm]    = useState({});
  const [saving,  setSaving]  = useState(false);

  // Reset form when task changes
  useMemo(() => {
    if (editTask) {
      setFlipped(false);
      setForm({ task: editTask.task, category: editTask.category || "deep_work", priority: editTask.priority || "medium" });
    }
  }, [editTask?.id]);

  async function handleSave() {
    if (!editTask) return;
    setSaving(true);
    try {
      await updateTask(editTask.id, form);
      onUpdate?.();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  const cfg = CATEGORY_3D[editTask?.category] || CATEGORY_3D.admin;

  return (
    <AnimatePresence>
      {editTask && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <div style={{ perspective: "1200px", width: 360, height: 300 }}>
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
                <div className="flex items-start justify-between mb-4">
                  <span
                    className="px-2.5 py-1 rounded-full text-[10px] font-medium"
                    style={{ background: CATEGORY_BG[editTask?.category] || CATEGORY_BG.admin, border: `1px solid ${cfg.color}`, color: "#fff" }}
                  >
                    {cfg.label}
                  </span>
                  <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="flex-1 text-sm leading-relaxed text-white/85">{editTask?.task}</p>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: PRIORITY_COLOR[editTask?.priority] || PRIORITY_COLOR.medium }} />
                    <span className="text-xs capitalize text-white/35">{editTask?.priority || "medium"} priority</span>
                  </div>
                  <button
                    onClick={() => setFlipped(true)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                    style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.35)" }}
                  >
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
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
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
                  <select
                    value={form.category || "deep_work"}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="px-2 py-2 text-xs rounded-lg focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
                  >
                    {CATEGORIES.map(({ value, label }) => (
                      <option key={value} value={value} style={{ background: "#12121f" }}>{label}</option>
                    ))}
                  </select>
                  <select
                    value={form.priority || "medium"}
                    onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                    className="px-2 py-2 text-xs rounded-lg focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
                  >
                    {PRIORITIES.map(({ value, label }) => (
                      <option key={value} value={value} style={{ background: "#12121f" }}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => setFlipped(false)}
                    className="flex-1 py-2 text-xs rounded-lg transition-all"
                    style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-2 text-xs font-medium rounded-lg transition-all"
                    style={{ background: saving ? "rgba(124,58,237,0.25)" : "linear-gradient(135deg,#7c3aed,#6d28d9)", color: "#fff", boxShadow: saving ? "none" : "0 0 16px rgba(124,58,237,0.4)", opacity: saving ? 0.6 : 1 }}
                  >
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

// ─── Camera presets per schedule type ────────────────────────────────────────

const CAMERA_PRESETS = {
  daily:   { position: [0, -4, 16],  fov: 50 },
  weekly:  { position: [0,  2, 22],  fov: 60 },
  monthly: { position: [0,  3, 20],  fov: 55 },
  yearly:  { position: [0,  4, 22],  fov: 60 },
};

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="absolute top-3 left-3 flex flex-wrap gap-2 pointer-events-none">
      {Object.entries(CATEGORY_3D).map(([key, { color, label }]) => (
        <div key={key} className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: color }} />
          <span className="text-[10px] text-white/35">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function Calendar3DView({ plan, onUpdate }) {
  const [editTask, setEditTask] = useState(null);
  const type = plan?.schedule_type || "daily";
  const preset = CAMERA_PRESETS[type] || CAMERA_PRESETS.daily;

  return (
    <div style={{ height: 560, position: "relative" }}>
      <Legend />
      <Canvas
        camera={{ position: preset.position, fov: preset.fov }}
        style={{ borderRadius: 12 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#06060f"]} />
        <fog attach="fog" args={["#06060f", 25, 65]} />
        <ambientLight intensity={0.35} />
        <pointLight position={[0, 10, 10]}  intensity={1.2} color="#a78bfa" />
        <pointLight position={[0, -10, 5]}  intensity={0.6} color="#22d3ee" />
        <Stars radius={80} depth={50} count={3000} factor={3} fade />
        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          maxPolarAngle={Math.PI * 0.75}
          minDistance={5}
          maxDistance={40}
        />
        <ScheduleScene plan={plan} onSelect={setEditTask} />
      </Canvas>
      <FlipCardModal
        editTask={editTask}
        onClose={() => setEditTask(null)}
        onUpdate={onUpdate}
      />
    </div>
  );
}
