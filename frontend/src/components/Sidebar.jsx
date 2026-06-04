import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useSidebar } from "./SidebarContext.jsx";
import "./Sidebar.css";

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
  const { isOpen, setIsOpen } = useSidebar();
  
  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="inner"> 
        <header> 
          <button
            type="button"
            className="sidebar-burger"
            onClick={() => setIsOpen(!isOpen)}
          >
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #22d3ee)",
                boxShadow: "0 0 16px rgba(124,58,237,0.5)",
              }}
            >
              <svg
                className="w-4 h-4 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </button>
          {/* Wordmark — fades in when sidebar opens */}
          <div className="flex-1 min-w-0 pl-3 logo">
            <span
              onClick={() => navigate("/")}
              className="text-base font-semibold tracking-tight text-white font-display whitespace-nowrap cursor-pointer"
            >
              MomentumOS
            </span>
          </div>
        </header>

        { /* Nav Section */ }
        <nav>
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
                <p>{item.label}</p>
              </motion.div>
            )}
          </NavLink>
        ))}
        </nav>
      </div>
    </aside>
  );
}
