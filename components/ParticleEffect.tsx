"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ParticleEffectProps {
    type: 'gather' | 'swirl';
    count?: number;
    color?: string;
    duration?: number;
    onComplete?: () => void;
}

interface Particle {
    id: number;
    initial: any;
    target: any;
    style: any;
}

export default function ParticleEffect({
    type = 'gather',
    count = 30,
    color = '#fbbf24', // amber-400
    duration = 2.0,
    onComplete
}: ParticleEffectProps) {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        // Generate particles only on client-side to prevent hydration mismatch
        const newParticles = Array.from({ length: count }, (_, i) => {
            const size = Math.random() * 4 + 2;

            let initial = {};
            let target = {};

            if (type === 'gather') {
                const angle = Math.random() * Math.PI * 2;
                const distance = 100 + Math.random() * 200;
                initial = {
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance,
                    opacity: 0,
                    scale: 0.5
                };
                target = {
                    x: 0,
                    y: 0,
                    opacity: [0, 1, 0, 0],
                    scale: [0.5, 1.5, 0],
                    transition: {
                        duration: duration,
                        ease: "easeInOut",
                        delay: Math.random() * 0.5
                    }
                };
            } else { // swirl
                const angle = (i / count) * Math.PI * 2 * 3;
                const distance = 150;
                initial = {
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance,
                    opacity: 0,
                    scale: 1
                };
                target = {
                    x: 0,
                    y: 0,
                    opacity: [0, 1, 0],
                    scale: [1, 0.2, 0],
                    rotate: 720,
                    transition: {
                        duration: duration,
                        ease: "easeInOut",
                        delay: (i / count) * 0.5
                    }
                };
            }

            return {
                id: i,
                initial,
                target,
                style: {
                    backgroundColor: color,
                    width: size + 'px',
                    height: size + 'px',
                }
            };
        });

        setParticles(newParticles);

        const timer = setTimeout(() => {
            if (onComplete) onComplete();
        }, duration * 1000 + 500); // Add buffer

        return () => clearTimeout(timer);
    }, [count, duration, onComplete, type, color]);

    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 overflow-hidden">
            <AnimatePresence>
                {particles.map((p) => (
                    <motion.div
                        key={p.id}
                        className="absolute rounded-full shadow-[0_0_10px_currentColor]"
                        style={p.style}
                        initial={p.initial}
                        animate={p.target}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}
