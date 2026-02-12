"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function StarryBackground() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Stardust particles configuration
    // Using memo or static definition to prevent re-creation on every render if possible, 
    // but inside component is fine for this scale. 
    // We want them to persist, so this component should be at the Layout level or Page level wrapping everything.
    const particles = Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        duration: Math.random() * 3 + 4, // Slower, more ambient
        delay: Math.random() * 5,
    }));

    return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-black pointer-events-none">
            {/* Background Layer */}
            <div className="absolute inset-0 bg-[url('/stars.png')] bg-cover opacity-40 z-0 animate-pulse-slow" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-purple-950 to-black z-0 opacity-80" />

            {/* Stardust Particles */}
            {mounted && particles.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute bg-white rounded-full z-0 opacity-0 shadow-[0_0_5px_rgba(255,255,255,0.8)]"
                    initial={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                        opacity: 0,
                    }}
                    animate={{
                        y: [0, -30, 0],
                        opacity: [0, 0.6, 0],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        delay: p.delay,
                        ease: "easeInOut"
                    }}
                />
            ))}

            {/* Central Glow - Subtle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-[120px] z-0" />
        </div>
    );
}
