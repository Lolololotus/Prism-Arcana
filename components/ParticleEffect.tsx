"use client";

import React, { useMemo } from "react";
import { motion, Variants } from "framer-motion";

interface ParticleEffectProps {
    type: "gather" | "swirl" | "burst";
    color?: string;
    count?: number;
    duration?: number;
}

export default function ParticleEffect({
    type,
    color = "#fbbf24",
    count = 40,
    duration = 2,
}: ParticleEffectProps) {

    const particles = useMemo(() => {
        return Array.from({ length: count }).map((_, i) => ({
            id: i,
            x: Math.random() * 200 - 100,
            y: Math.random() * 200 - 100,
            size: Math.random() * 3 + 1,
            delay: Math.random() * duration,
        }));
    }, [count, duration]);

    // [V0.3 FIX] Variants 구조를 평면화하여 TS 인덱스 시그니처 에러 해결
    const getVariants = (p: { x: number, y: number }): Variants => ({
        gather_start: { x: p.x * 2, y: p.y * 2, opacity: 0 },
        gather_end: { x: 0, y: 0, opacity: [0, 1, 0] },

        swirl_start: { x: p.x, y: p.y, opacity: 0, scale: 1, rotate: 0 },
        swirl_end: { x: 0, y: 0, rotate: 360, opacity: [0, 0.8, 0], scale: 0.2 },

        burst_start: { x: 0, y: 0, opacity: 1, scale: 0 },
        burst_end: { x: p.x * 1.5, y: p.y * 1.5, opacity: 0, scale: 1 }
    });

    return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    variants={getVariants(p)}
                    initial={`${type}_start`}
                    animate={`${type}_end`}
                    transition={{
                        duration: duration,
                        repeat: Infinity,
                        delay: p.delay,
                        ease: "easeInOut",
                    }}
                    className="absolute rounded-full"
                    style={{
                        width: p.size,
                        height: p.size,
                        backgroundColor: color,
                        boxShadow: `0 0 8px ${color}`,
                    }}
                />
            ))}
        </div>
    );
}