"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TitleScreenProps {
    onStart: () => void;
}

export default function TitleScreen({ onStart }: TitleScreenProps) {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden">
            {/* Background elements moved to global StarryBackground component */}

            {/* Content Container */}
            <motion.div
                className="relative z-10 flex flex-col items-center text-center p-8"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
            >
                {/* Main Title */}
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold tracking-tight mb-4 relative group">
                    <span className="absolute inset-0 blur-2xl opacity-30 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 bg-clip-text text-transparent select-none">
                        Prism Arcana
                    </span>
                    <span className="bg-gradient-to-r from-indigo-200 via-purple-100 to-amber-100 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(255,215,0,0.3)]">
                        Prism Arcana
                    </span>
                </h1>

                {/* Divider/Prism Line */}
                <motion.div
                    className="w-32 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent mb-6"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 128, opacity: 1 }}
                    transition={{ delay: 0.8, duration: 1 }}
                />

                {/* Subtitle */}
                <p className="text-sm md:text-base text-gray-300 font-sans font-light tracking-[0.2em] uppercase opacity-80 mb-12">
                    우주의 숫자를 빛의 숨결로 빚어내는 나만의 인생 카드
                </p>

                {/* Enter Button */}
                <motion.button
                    onClick={onStart}
                    className="group relative px-8 py-3 overflow-hidden rounded-full transition-all duration-300 hover:scale-105"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.5 }}
                >
                    <div className="absolute inset-0 border border-white/20 rounded-full group-hover:border-white/50 transition-colors" />
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center gap-2 text-white/70 group-hover:text-white font-serif tracking-widest text-xs">
                        <span>ENTER THE PRISM</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                </motion.button>
            </motion.div>
        </div>
    );
}
