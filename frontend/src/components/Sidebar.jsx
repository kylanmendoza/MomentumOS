import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const navItems = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
        />
      </svg>
    ),
  },
  {
    to: "/create",
    label: "New Plan",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 4.5v15m7.5-7.5h-15"
        />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  
  return (
    <motion.aside
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="fixed top-0 left-0 z-30 flex flex-col w-64 h-full"
      style={{
        background: "rgba(13,13,26,0.85)",
        backdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #22d3ee)",
              boxShadow: "0 0 16px rgba(124,58,237,0.5)",
            }}
            onClick={() => navigate("/")}
          >
            <svg
              className="w-4 h-4 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div 
            onClick={() => navigate("/")}
            className="cursor-pointer"
          >
            <span className="text-base font-semibold tracking-tight text-white font-display">
              MomentumOS
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div
        className="mx-4 mb-4"
        style={{ height: 1, background: "rgba(255,255,255,0.05)" }}
      />

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to}>
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: 3 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background: isActive
                    ? "rgba(124,58,237,0.15)"
                    : "transparent",
                  color: isActive
                    ? "#a78bfa"
                    : "rgba(255,255,255,0.45)",
                  borderLeft: isActive
                    ? "2px solid #7c3aed"
                    : "2px solid transparent",
                }}
              >
                {item.icon}
                {item.label}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom badge */}
      <div className="p-4">
        <div
          className="p-3 text-center glass rounded-xl"
          style={{ border: "1px solid rgba(124,58,237,0.2)" }}
        >
          <p className="text-[11px] text-white/30 uppercase tracking-widest mb-1">
            Powered by
          </p>
          <p className="text-xs font-medium text-accent-light">OpenAI GPT-4o</p>
        </div>
      </div>
    </motion.aside>
  );
}
