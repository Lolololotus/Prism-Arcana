"use client";

import React, { useState, useEffect } from "react";
import { X, Play, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface RewardAdModalProps {
    isOpen: boolean;
    onClose: () => void;
    onReward: () => void;
}

export default function RewardAdModal({ isOpen, onClose, onReward }: RewardAdModalProps) {
    const [timeLeft, setTimeLeft] = useState(15);
    const [isCompleted, setIsCompleted] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isOpen && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsCompleted(true);
        }
        return () => clearInterval(timer);
    }, [isOpen, timeLeft]);

    const handleClose = () => {
        if (isCompleted) {
            onReward();
        }
        onClose();
        // Reset for next time if needed
        setTimeLeft(15);
        setIsCompleted(false);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
            >
                <div className="relative w-full max-w-lg aspect-video bg-black border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
                    {/* Ad Content Placeholder */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-black">
                        <Play className="w-16 h-16 text-white/50 mb-4" />
                        <h3 className="text-2xl font-bold text-white tracking-widest uppercase">Prism Arcana</h3>
                        <p className="text-purple-300 text-sm mt-2">Brand Film</p>
                    </div>

                    {/* UI Overlay */}
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                        <div className="bg-black/50 px-3 py-1 rounded-full text-xs text-white border border-white/10 backdrop-blur-sm">
                            Ad · {timeLeft > 0 ? `Reward in ${timeLeft}s` : "Reward Granted"}
                        </div>
                        {isCompleted && (
                            <button
                                onClick={handleClose}
                                className="bg-white/10 hover:bg-white/20 p-1 rounded-full text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="absolute bottom-0 left-0 h-1 bg-purple-600 transition-all duration-1000 ease-linear" style={{ width: `${((15 - timeLeft) / 15) * 100}%` }} />
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
