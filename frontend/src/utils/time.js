// Converts "HH:MM-HH:MM" military format to "H:MM AM – H:MM PM" standard.
// Passes through strings that already contain AM/PM unchanged — safe to call
// on both old DB records (military) and new AI responses (standard).
export function toStandardTime(timeBlock) {
  if (!timeBlock) return timeBlock;
  if (/[AaPp][Mm]/.test(timeBlock)) return timeBlock;

  return timeBlock.replace(/(\d{1,2}):(\d{2})/g, (_, h, m) => {
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const std = hour % 12 || 12;
    return `${std}:${m} ${ampm}`;
  }).replace("-", "–");
}
