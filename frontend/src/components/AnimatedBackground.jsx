import { motion } from "framer-motion";

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Deep base */}
      <div className="absolute inset-0 bg-[#06060f]" />

      {/* Grid lines */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(167,139,250,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(167,139,250,1) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Primary purple orb */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 700,
          height: 700,
          top: "-20%",
          left: "-10%",
          background:
            "radial-gradient(circle, rgba(109,40,217,0.18) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Cyan orb bottom-right */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 600,
          height: 600,
          bottom: "-15%",
          right: "-5%",
          background:
            "radial-gradient(circle, rgba(34,211,238,0.12) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
        animate={{ x: [0, -25, 0], y: [0, 20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* Accent mid orb */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 400,
          height: 400,
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Noise overlay */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }}
      />
    </div>
  );
}
