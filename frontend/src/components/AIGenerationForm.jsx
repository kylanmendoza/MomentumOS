import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generatePlan, savePlan } from "../api/index.js";
import { toStandardTime } from "../utils/time.js";

const SCHEDULE_LABEL = {
  daily:   "Daily",
  weekly:  "Weekly",
  monthly: "Monthly",
  yearly:  "Yearly",
};

export default function AIGenerationForm({ onSaved }) {
  const [form,         setForm]         = useState({ title: "", goals: "" });
  const [loading,      setLoading]      = useState(false);
  const [preview,      setPreview]      = useState(null);     // { scheduleType, tasks }
  const [error,        setError]        = useState(null);
  const [saved,        setSaved]        = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setPreview(null);
    setSaved(false);
    setError(null);
  }

  async function handleGenerate(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPreview(null);
    setSaved(false);
    try {
      const res = await generatePlan({ goals: form.goals });
      setPreview({ scheduleType: res.data.scheduleType, tasks: res.data.schedule });
    } catch (err) {
      setError(err.response?.data?.error || "Generation failed. Check your API key.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!preview) return;
    setLoading(true);
    try {
      await savePlan({
        title: form.title ||
          `${SCHEDULE_LABEL[preview.scheduleType] || "Plan"} — ${new Date().toLocaleDateString()}`,
        goals:         form.goals,
        schedule_type: preview.scheduleType,
        tasks:         preview.tasks,
      });
      setSaved(true);
      setPreview(null);
      setForm({ title: "", goals: "" });
      onSaved?.();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save plan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleGenerate} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-white/40 uppercase tracking-widest mb-2">
            Plan Title
          </label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="My Focus Day"
            className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.5)")}
            onBlur={(e)  => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
          />
        </div>

        {/* Goals */}
        <div>
          <label className="block text-xs font-medium text-white/40 uppercase tracking-widest mb-2">
            What do you want to accomplish? *
          </label>
          <textarea
            name="goals"
            value={form.goals}
            onChange={handleChange}
            required
            rows={5}
            placeholder={`Describe your goals naturally — the AI handles the rest.\n\ne.g. "I need to finish the landing page today, review PRs at 2 PM, and work out for 30 min"\nor "Plan my week: Monday tackle auth bugs, Wednesday team sync, Friday deploy"`}
            className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all resize-none leading-relaxed"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.5)")}
            onBlur={(e)  => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
          />
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs text-red-400 px-1"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary w-full text-white flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <motion.div
                className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
              />
              Generating…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate Schedule
            </>
          )}
        </motion.button>
      </form>

      {/* Preview */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/40 uppercase tracking-widest">
                Preview — {preview.tasks.length} blocks
              </p>
              <span
                className="px-2.5 py-1 rounded-full text-[10px] font-medium"
                style={{
                  background: "rgba(124,58,237,0.15)",
                  color:      "#a78bfa",
                  border:     "1px solid rgba(124,58,237,0.3)",
                }}
              >
                {SCHEDULE_LABEL[preview.scheduleType] || preview.scheduleType}
              </span>
            </div>

            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {preview.tasks.map((block, i) => (
                <div
                  key={i}
                  className="flex gap-3 p-2.5 rounded-lg text-sm"
                  style={{ background: "rgba(124,58,237,0.08)" }}
                >
                  <span className="text-accent-light/70 font-mono text-xs flex-shrink-0 pt-0.5">
                    {toStandardTime(block.time)}
                  </span>
                  <span className="text-white/70">{block.task}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={loading}
                className="btn-primary flex-1 text-white text-sm"
              >
                Save to Dashboard
              </motion.button>
              <button onClick={() => setPreview(null)} className="btn-ghost text-sm">
                Discard
              </button>
            </div>
          </motion.div>
        )}
        {saved && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-emerald-400 text-center"
          >
            Plan saved to your dashboard!
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
