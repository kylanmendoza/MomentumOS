import { useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { motion, AnimatePresence } from "framer-motion";
import { updateTask } from "../api/index.js";
import {
  timeBlockToISO,
  datesToTimeBlock,
  dayNameToDate,
  weekNumToDate,
  monthNameToDate,
} from "../utils/time.js";

const CATEGORY_CONFIG = {
  deep_work: { bg: "rgba(109,40,217,0.75)", border: "#7c3aed", label: "Deep Work" },
  creative:  { bg: "rgba(139,92,246,0.65)", border: "#8b5cf6", label: "Creative"  },
  review:    { bg: "rgba(124,58,237,0.55)", border: "#7c3aed", label: "Review"    },
  break:     { bg: "rgba(8,145,178,0.60)",  border: "#0891b2", label: "Break"     },
  personal:  { bg: "rgba(6,182,212,0.55)",  border: "#06b6d4", label: "Personal"  },
  admin:     { bg: "rgba(75,85,99,0.70)",   border: "#4b5563", label: "Admin"     },
};

const PRIORITY_DOT  = { high: "#f87171", medium: "#fbbf24", low: "#34d399" };
const CATEGORIES    = Object.entries(CATEGORY_CONFIG).map(([value, { label }]) => ({ value, label }));
const PRIORITIES    = [
  { value: "high",   label: "High"   },
  { value: "medium", label: "Medium" },
  { value: "low",    label: "Low"    },
];

function getInitialView(type) {
  if (type === "weekly")  return "timeGridWeek";
  if (type === "monthly") return "dayGridMonth";
  if (type === "yearly")  return "dayGridMonth";
  return "timeGridDay";
}

function taskToEvent(task, plan) {
  const cfg  = CATEGORY_CONFIG[task.category] || CATEGORY_CONFIG.admin;
  const base = {
    id:              task.id,
    title:           task.task,
    backgroundColor: cfg.bg,
    borderColor:     cfg.border,
    textColor:       "#ffffff",
    extendedProps:   { task },
  };

  const ref  = plan.created_at;
  const type = plan.schedule_type || "daily";

  if (type === "daily") {
    const iso = timeBlockToISO(task.time_block, ref);
    if (iso) return { ...base, start: iso.start, end: iso.end };
  }

  if (type === "weekly") {
    // Handle "Monday: 9:00 AM - 10:00 AM" format
    const dayMatch = task.time_block?.match(
      /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i
    );
    if (dayMatch) {
      const date     = dayNameToDate(dayMatch[1], ref);
      const timeOnly = task.time_block.replace(/^[a-z]+\s*:\s*/i, "");
      const iso      = timeBlockToISO(timeOnly, date || ref);
      if (iso)  return { ...base, start: iso.start, end: iso.end };
      if (date) return { ...base, start: date, allDay: true };
    }
    const iso = timeBlockToISO(task.time_block, ref);
    if (iso) return { ...base, start: iso.start, end: iso.end };
  }

  if (type === "monthly" || type === "yearly") {
    const weekMatch = task.time_block?.match(/week\s*\d+/i);
    if (weekMatch) {
      const date = weekNumToDate(weekMatch[0], ref);
      if (date) return { ...base, start: date, allDay: true };
    }
    const monthMatch = task.time_block?.match(
      /january|february|march|april|may|june|july|august|september|october|november|december/i
    );
    if (monthMatch) {
      const date = monthNameToDate(monthMatch[0], ref);
      if (date) return { ...base, start: date, allDay: true };
    }
  }

  return { ...base, start: new Date(ref).toISOString().split("T")[0], allDay: true };
}

function renderEventContent(arg) {
  const task = arg.event.extendedProps.task;
  const dot  = PRIORITY_DOT[task?.priority] || PRIORITY_DOT.medium;
  return (
    <div className="flex items-start gap-1 px-1 py-0.5 h-full overflow-hidden">
      <span
        className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: dot }}
      />
      <div className="min-w-0">
        <div className="text-[10px] opacity-70 leading-tight font-variant-numeric tabular-nums truncate">
          {arg.timeText}
        </div>
        <div className="text-[11px] font-medium leading-snug line-clamp-2">{arg.event.title}</div>
      </div>
    </div>
  );
}

export default function CalendarView({ plan, onUpdate }) {
  const [editTask, setEditTask] = useState(null);
  const [flipped,  setFlipped]  = useState(false);
  const [form,     setForm]     = useState({});
  const [saving,   setSaving]   = useState(false);

  const events = useMemo(
    () => (plan?.tasks ?? []).map((t) => taskToEvent(t, plan)),
    [plan]
  );

  const initialView = getInitialView(plan?.schedule_type);
  const initialDate = useMemo(() => {
    if (!plan?.created_at) return undefined;
    return new Date(plan.created_at).toISOString().split("T")[0];
  }, [plan?.created_at]);

  const headerToolbar = useMemo(() => {
    const type = plan?.schedule_type;
    return {
      left:   "prev,next today",
      center: "title",
      right:
        type === "weekly"
          ? "timeGridWeek,timeGridDay"
          : type === "monthly" || type === "yearly"
          ? "dayGridMonth"
          : "timeGridDay",
    };
  }, [plan?.schedule_type]);

  function handleEventClick({ event }) {
    const task = event.extendedProps.task;
    setEditTask(task);
    setFlipped(false);
    setForm({
      task:     task.task,
      category: task.category || "deep_work",
      priority: task.priority || "medium",
    });
  }

  async function handleDrop({ event, revert }) {
    const start = event.start;
    const end   = event.end || new Date(start.getTime() + 60 * 60 * 1000);
    try {
      await updateTask(event.id, { time_block: datesToTimeBlock(start, end) });
      onUpdate?.();
    } catch {
      revert();
    }
  }

  async function handleResize({ event, revert }) {
    if (!event.end) { revert(); return; }
    try {
      await updateTask(event.id, { time_block: datesToTimeBlock(event.start, event.end) });
      onUpdate?.();
    } catch {
      revert();
    }
  }

  async function handleSave() {
    if (!editTask) return;
    setSaving(true);
    try {
      await updateTask(editTask.id, form);
      onUpdate?.();
      closeModal();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  function closeModal() {
    setEditTask(null);
    setFlipped(false);
  }

  const frontCfg = CATEGORY_CONFIG[editTask?.category] || CATEGORY_CONFIG.admin;

  return (
    <div className="relative">
      {/* Category legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
            />
            <span className="text-[10px] text-white/35">{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <FullCalendar
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
        initialView={initialView}
        initialDate={initialDate}
        events={events}
        editable
        eventDrop={handleDrop}
        eventResize={handleResize}
        eventClick={handleEventClick}
        eventContent={renderEventContent}
        headerToolbar={headerToolbar}
        height="auto"
        nowIndicator
        allDaySlot={plan?.schedule_type !== "daily"}
        scrollTime="08:00:00"
        slotMinTime="06:00:00"
        slotMaxTime="23:00:00"
        slotDuration="00:30:00"
        expandRows
        stickyHeaderDates
      />

      {/* Flip-card modal */}
      <AnimatePresence>
        {editTask && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          >
            {/* Flip card */}
            <div style={{ perspective: "1200px", width: 360, height: 300 }}>
              <motion.div
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  width:            "100%",
                  height:           "100%",
                  position:         "relative",
                  transformStyle:   "preserve-3d",
                }}
              >
                {/* ── FRONT: task details ─────────────────────── */}
                <div
                  className="absolute inset-0 rounded-2xl p-6 flex flex-col"
                  style={{
                    backfaceVisibility:       "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    background:               "#12121f",
                    border:                   "1px solid rgba(255,255,255,0.1)",
                    boxShadow:                "0 24px 64px rgba(0,0,0,0.65)",
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <span
                      className="px-2.5 py-1 rounded-full text-[10px] font-medium"
                      style={{
                        background: frontCfg.bg,
                        border:     `1px solid ${frontCfg.border}`,
                        color:      "#fff",
                      }}
                    >
                      {frontCfg.label}
                    </span>
                    <button
                      onClick={closeModal}
                      className="text-white/30 hover:text-white/70 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <p className="text-white/85 text-sm leading-relaxed flex-1">{editTask.task}</p>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: PRIORITY_DOT[editTask.priority] || PRIORITY_DOT.medium }}
                      />
                      <span className="text-xs text-white/35 capitalize">
                        {editTask.priority || "medium"} priority
                      </span>
                    </div>
                    <button
                      onClick={() => setFlipped(true)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                      style={{
                        background: "rgba(124,58,237,0.2)",
                        color:      "#a78bfa",
                        border:     "1px solid rgba(124,58,237,0.35)",
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </div>

                {/* ── BACK: edit form ──────────────────────────── */}
                <div
                  className="absolute inset-0 rounded-2xl p-6 flex flex-col"
                  style={{
                    backfaceVisibility:       "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform:                "rotateY(180deg)",
                    background:               "#12121f",
                    border:                   "1px solid rgba(124,58,237,0.3)",
                    boxShadow:                "0 24px 64px rgba(0,0,0,0.65)",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-medium text-white/40 uppercase tracking-widest">
                      Edit Task
                    </span>
                    <button
                      onClick={() => setFlipped(false)}
                      className="text-white/30 hover:text-white/70 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  </div>

                  <input
                    type="text"
                    value={form.task || ""}
                    onChange={(e) => setForm((f) => ({ ...f, task: e.target.value }))}
                    className="w-full text-sm rounded-lg px-3 py-2 mb-3 focus:outline-none"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border:     "1px solid rgba(255,255,255,0.1)",
                      color:      "rgba(255,255,255,0.8)",
                    }}
                    placeholder="Task name"
                  />

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <select
                      value={form.category || "deep_work"}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      className="text-xs rounded-lg px-2 py-2 focus:outline-none"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border:     "1px solid rgba(255,255,255,0.1)",
                        color:      "rgba(255,255,255,0.7)",
                      }}
                    >
                      {CATEGORIES.map(({ value, label }) => (
                        <option key={value} value={value} style={{ background: "#12121f" }}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={form.priority || "medium"}
                      onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                      className="text-xs rounded-lg px-2 py-2 focus:outline-none"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border:     "1px solid rgba(255,255,255,0.1)",
                        color:      "rgba(255,255,255,0.7)",
                      }}
                    >
                      {PRIORITIES.map(({ value, label }) => (
                        <option key={value} value={value} style={{ background: "#12121f" }}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => setFlipped(false)}
                      className="flex-1 text-xs py-2 rounded-lg transition-all"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        color:      "rgba(255,255,255,0.4)",
                        border:     "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 text-xs py-2 rounded-lg font-medium transition-all"
                      style={{
                        background: saving
                          ? "rgba(124,58,237,0.25)"
                          : "linear-gradient(135deg, #7c3aed, #6d28d9)",
                        color:      "#fff",
                        boxShadow:  saving ? "none" : "0 0 16px rgba(124,58,237,0.4)",
                        opacity:    saving ? 0.6 : 1,
                      }}
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
    </div>
  );
}
