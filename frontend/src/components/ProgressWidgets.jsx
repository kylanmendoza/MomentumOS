import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import GlassCard from "./GlassCard.jsx";

ChartJS.register(ArcElement, Tooltip, CategoryScale, LinearScale, BarElement);

const CATEGORY_LABELS = ["Deep Work", "Creative", "Review", "Break", "Personal", "Admin"];
const CATEGORY_KEYS   = ["deep_work", "creative", "review", "break", "personal", "admin"];
const CATEGORY_COLORS = [
  "rgba(124,58,237,0.8)",
  "rgba(34,211,238,0.8)",
  "rgba(59,130,246,0.8)",
  "rgba(34,197,94,0.8)",
  "rgba(236,72,153,0.8)",
  "rgba(249,115,22,0.8)",
];

const TOOLTIP_STYLE = {
  backgroundColor: "rgba(13,13,26,0.95)",
  borderColor: "rgba(124,58,237,0.3)",
  borderWidth: 1,
  titleColor: "#fff",
  bodyColor: "rgba(255,255,255,0.55)",
  padding: 8,
};

export default function ProgressWidgets({ plans = [] }) {
  const totalTasks     = plans.reduce((s, p) => s + p.tasks.length, 0);
  const completedTasks = plans.reduce((s, p) => s + p.tasks.filter(t => t.completed).length, 0);
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const plansToday     = plans.filter(p => {
    const d = new Date(p.created_at);
    return d.toDateString() === new Date().toDateString();
  }).length;

  const catCounts = CATEGORY_KEYS.map(cat =>
    plans.reduce((sum, p) => sum + p.tasks.filter(t => t.category === cat).length, 0)
  );
  const hasCategories = catCounts.some(c => c > 0);

  const doughnutData = {
    datasets: [{
      data: [completedTasks, Math.max(totalTasks - completedTasks, 0)],
      backgroundColor: ["rgba(124,58,237,0.85)", "rgba(255,255,255,0.06)"],
      borderColor:     ["rgba(124,58,237,0.4)",  "rgba(255,255,255,0.04)"],
      borderWidth: 1,
      hoverOffset: 4,
    }],
  };

  const doughnutOptions = {
    cutout: "76%",
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    animation: { animateRotate: true, duration: 1000 },
  };

  const barData = {
    labels: CATEGORY_LABELS,
    datasets: [{
      data: catCounts,
      backgroundColor: CATEGORY_COLORS,
      borderRadius: 4,
      borderSkipped: false,
    }],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { ...TOOLTIP_STYLE },
    },
    scales: {
      x: {
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: { color: "rgba(255,255,255,0.35)", font: { size: 9 } },
      },
      y: {
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: { color: "rgba(255,255,255,0.35)", font: { size: 9 }, stepSize: 1 },
        beginAtZero: true,
      },
    },
  };

  const stats = [
    { label: "Total Plans",  value: plans.length },
    { label: "Tasks Done",   value: completedTasks },
    { label: "Remaining",    value: totalTasks - completedTasks },
    { label: "Plans Today",  value: plansToday },
  ];

  return (
    <GlassCard className="p-6" delay={0.2}>
      <h3 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-5">
        Progress
      </h3>

      {/* Completion ring + stats */}
      <div className="flex items-center gap-5 mb-5">
        <div className="relative w-24 h-24 flex-shrink-0">
          <Doughnut data={doughnutData} options={doughnutOptions} />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-semibold text-white">{completionRate}%</span>
            <span className="text-[9px] text-white/30 mt-0.5">complete</span>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-2">
          {stats.map(s => (
            <div
              key={s.label}
              className="text-center p-2.5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <p className="text-lg font-semibold text-white">{s.value}</p>
              <p className="text-[9px] text-white/30 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Category bar chart */}
      {hasCategories && (
        <>
          <p className="text-[10px] text-white/25 uppercase tracking-widest mb-2">
            Tasks by Category
          </p>
          <Bar data={barData} options={barOptions} />
        </>
      )}
    </GlassCard>
  );
}
