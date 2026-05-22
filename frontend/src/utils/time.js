// ─── Display helpers ──────────────────────────────────────────────────────────

// Converts "HH:MM-HH:MM" military format to "H:MM AM – H:MM PM".
// Idempotent: passes through strings that already contain AM/PM.
export function toStandardTime(timeBlock) {
  if (!timeBlock) return timeBlock;
  if (/[AaPp][Mm]/.test(timeBlock)) return timeBlock;
  return timeBlock
    .replace(/(\d{1,2}):(\d{2})/g, (_, h, m) => {
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      const std  = hour % 12 || 12;
      return `${std}:${m} ${ampm}`;
    })
    .replace("-", "–");
}

// ─── Parsing helpers ──────────────────────────────────────────────────────────

// "9:00 AM" → minutes from midnight (e.g. 540).  Returns null on failure.
export function parseTimeToMin(str) {
  const m = String(str).trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return null;
  let h = parseInt(m[1]);
  const min = parseInt(m[2]);
  const p   = m[3].toUpperCase();
  if (p === "PM" && h !== 12) h += 12;
  if (p === "AM" && h === 12) h = 0;
  return h * 60 + min;
}

// ─── FullCalendar ISO conversion ──────────────────────────────────────────────

// "9:00 AM" + Date/string → local ISO datetime string ("2026-05-21T09:00:00")
export function timeStringToISO(timeStr, date) {
  const minutes = parseTimeToMin(timeStr);
  if (minutes === null) return null;
  const d = new Date(date);
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  // Return local ISO (no Z suffix so FullCalendar treats it as local time)
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

// "9:00 AM - 9:45 AM" + Date → { start: ISO, end: ISO } or null
export function timeBlockToISO(timeBlock, date) {
  if (!timeBlock) return null;
  const parts = timeBlock.split(/\s*[–\-]\s*/);
  if (parts.length < 2) return null;
  const start = timeStringToISO(parts[0].trim(), date);
  const end   = timeStringToISO(parts[1].trim(), date);
  if (!start || !end) return null;
  return { start, end };
}

// Date object → "H:MM AM"
function dateToTimeStr(date) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

// Two Date objects (from FullCalendar drag/resize) → "H:MM AM - H:MM PM"
export function datesToTimeBlock(start, end) {
  return `${dateToTimeStr(start)} - ${dateToTimeStr(end)}`;
}

// ─── Non-daily date mapping ───────────────────────────────────────────────────

const DAY_IDX = { sunday:0, monday:1, tuesday:2, wednesday:3, thursday:4, friday:5, saturday:6 };

// "Monday" + referenceDate → "YYYY-MM-DD" of that weekday in the plan's week
export function dayNameToDate(dayName, referenceDate) {
  const target = DAY_IDX[dayName.toLowerCase()];
  if (target === undefined) return null;
  const ref  = new Date(referenceDate);
  const diff = target - ref.getDay();
  ref.setDate(ref.getDate() + diff);
  return ref.toISOString().split("T")[0];
}

// "Week 1" + referenceDate → first day of that week within the plan's month
export function weekNumToDate(weekStr, referenceDate) {
  const match = weekStr.match(/week\s*(\d+)/i);
  if (!match) return null;
  const weekNum = parseInt(match[1]) - 1;
  const ref     = new Date(referenceDate);
  const first   = new Date(ref.getFullYear(), ref.getMonth(), 1);
  first.setDate(first.getDate() + weekNum * 7);
  return first.toISOString().split("T")[0];
}

const MONTH_IDX = { january:0, february:1, march:2, april:3, may:4, june:5, july:6, august:7, september:8, october:9, november:10, december:11 };

// "January" + referenceDate → "YYYY-01-01"
export function monthNameToDate(monthName, referenceDate) {
  const idx = MONTH_IDX[monthName.toLowerCase()];
  if (idx === undefined) return null;
  const ref = new Date(referenceDate);
  return new Date(ref.getFullYear(), idx, 1).toISOString().split("T")[0];
}
