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

export default function ParticleEffect({
    type = 'gather',
    count = 30,
    color = '#fbbf24', // amber-400
    duration = 2.0,
    onComplete
}: ParticleEffectProps) {
    const [particles, setParticles] = useState<number[]>([]);

    useEffect(() => {
        // Generate particle IDs
        setParticles(Array.from({ length: count }, (_, i) => i));

        // Completion callback
        const timer = setTimeout(() => {
            if (onComplete) onComplete();
        }, duration * 1000);

        return () => clearTimeout(timer);
    }, [count, duration, onComplete]);

    // Randomize initial positions based on type
    const getInitialState = (i: number) => {
        if (type === 'gather') {
            // Start scattered randomly OUTSIDE or edges
            const angle = Math.random() * Math.PI * 2;
            const distance = 100 + Math.random() * 200; // Distance from center
            return {
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                opacity: 0,
                scale: 0.5
            };
        } else { // swirl
            // Start scattered around center but moving in
            const angle = (i / count) * Math.PI * 2 * 3; // 3 spirals
            const distance = 150;
            return {
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                opacity: 0,
                scale: 1
            };
        }
    };

    const getTargetState = (i: number) => {
        if (type === 'gather') {
            // Converge to center
            return {
                x: 0,
                y: 0,
                opacity: [0, 1, 0, 0], // Fade in then out at center
                scale: [0.5, 1.5, 0],
                transition: {
                    duration: duration,
                    ease: "easeInOut",
                    delay: Math.random() * 0.5
                }
            };
        } else { // swirl
            // Spiral into absolute center
            return {
                x: 0,
                y: 0,
                opacity: [0, 1, 0],
                scale: [1, 0.2, 0],
                rotate: 720, // Spin while converging
                transition: {
                    duration: duration,
                    ease: "easeInOut",
                    delay: (i / count) * 0.5 // Staggered spiral
                }
            };
        }
    };

    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 overflow-hidden">
            <AnimatePresence>
                {particles.map((i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full shadow-[0_0_10px_currentColor]"
                        style={{
                            backgroundColor: color,
                            width: Math.random() * 4 + 2 + 'px',
                            height: Math.random() * 4 + 2 + 'px',
                        }}
                        initial={getInitialState(i)}
                        animate={getTargetState(i)}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}
