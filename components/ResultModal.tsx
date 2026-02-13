"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share2, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import ParticleEffect from './ParticleEffect';

interface ResultModalProps {
    imageSrc: string;
    userName: string;
    onClose: () => void;
    onShowAd: () => void; // Trigger for 2026 Vision Flow
}

export default function ResultModal({ imageSrc, userName, onClose, onShowAd }: ResultModalProps) {
    const [isCopied, setIsCopied] = useState(false);

    const handleDownload = () => {
        // Simple download logic
        const link = document.createElement('a');
        link.href = imageSrc;
        link.download = `Prism-Arcana-${userName}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCopyLink = () => {
        // Mock copy link
        navigator.clipboard.writeText(window.location.href);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-white/50 hover:text-white transition-colors z-20"
                >
                    <X className="w-8 h-8" />
                </button>

                <div className="relative w-full max-w-lg flex flex-col items-center gap-8">

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        <h2 className="text-2xl md:text-3xl font-serif text-amber-100 mb-2 tracking-widest">
                            Light's Harvest
                        </h2>
                        <div className="w-12 h-[1px] bg-amber-500/50 mx-auto" />
                    </motion.div>

                    {/* The Card (Grand Altar Layout preserved in Modal) */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, rotateY: 180 }}
                        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                        transition={{ type: "spring", stiffness: 60, damping: 20, delay: 0.2 }}
                        className="relative w-[80%] aspect-[2/3] rounded-xl overflow-hidden shadow-[0_0_50px_rgba(255,215,0,0.3)] border border-amber-500/30 group"
                    >
                        {/* Particle Effect for "Swirl" Entry */}
                        <ParticleEffect type="swirl" count={50} duration={2} />

                        <img
                            src={imageSrc}
                            alt="Final Arcana"
                            className="w-full h-full object-cover"
                        />

                        {/* Watermark Overlay */}
                        <div className="absolute bottom-4 left-0 w-full text-center">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-serif shadow-black drop-shadow-md">
                                Prism Arcana <span className="mx-2">•</span> Created by {userName}
                            </p>
                        </div>
                    </motion.div>

                    {/* Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center gap-4 w-full px-4"
                    >
                        <button
                            onClick={handleDownload}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-amber-900/40 border border-amber-500/30 text-amber-100 hover:bg-amber-800/50 transition-all font-serif text-sm group"
                        >
                            <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            이미지로 저장
                        </button>
                        <button
                            onClick={handleCopyLink}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-white/5 border border-white/10 text-purple-100 hover:bg-white/10 transition-all font-serif text-sm group"
                        >
                            <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            {isCopied ? "복사 완료!" : "링크 복사"}
                        </button>
                    </motion.div>

                    {/* 2026 Vision Trigger (Ad Flow) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.0 }}
                        className="w-full pt-4 border-t border-white/10 mt-2"
                    >
                        <button
                            onClick={onShowAd}
                            className="w-full flex items-center justify-between px-6 py-4 rounded-xl bg-gradient-to-r from-purple-900/40 to-black border border-purple-500/30 text-left group hover:border-purple-400/50 transition-all"
                        >
                            <div className="flex flex-col">
                                <span className="text-[10px] text-purple-400 uppercase tracking-wider mb-1">Special Access</span>
                                <span className="text-sm text-purple-100 font-serif flex items-center gap-2">
                                    나의 2026년 운명의 카드 보기
                                    <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
                                </span>
                            </div>
                            <span className="text-purple-400 group-hover:translate-x-1 transition-transform">→</span>
                        </button>
                    </motion.div>

                </div>
            </motion.div>
        </AnimatePresence>
    );
}
