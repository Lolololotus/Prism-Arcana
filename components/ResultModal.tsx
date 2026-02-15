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
    onShowAd: () => void; // 2026년 운명 확인 flow를 트리거하는 prop
}

export default function ResultModal({ imageSrc, userName, onClose, onShowAd }: ResultModalProps) {
    const [isCopied, setIsCopied] = useState(false);

    // [V0.3 CONSTANT] 호칭 무결성 유지: '로터스 님' 강제 적용 [cite: 2026-02-11]
    const FIXED_NAME = "로터스 님";

    const handleDownload = () => {
        // [PHASE 6.1] 이미지 다운로드 로직: 유저의 이름을 파일명에 포함 [cite: 2026-02-11]
        const link = document.createElement('a');
        link.href = imageSrc;
        link.download = `Prism-Arcana-${FIXED_NAME}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCopyLink = () => {
        // 클립보드 복사 로직 (Legacy 지원)
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
                className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl"
            >
                {/* 닫기 버튼: 최상단 z-index 확보 */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-white/30 hover:text-white transition-colors z-30"
                >
                    <X className="w-8 h-8" />
                </button>

                <div className="relative w-full max-w-lg flex flex-col items-center gap-8 z-10">

                    {/* Header: 서사적 타이틀 [cite: 2026-02-11] */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        <h2 className="text-2xl md:text-3xl font-serif text-amber-100 mb-2 tracking-[0.3em] uppercase">
                            Light's Harvest
                        </h2>
                        <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto" />
                    </motion.div>

                    {/* 카드 영역: Grand Altar 레이아웃 계승 (80% 비율) */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, rotateY: 15 }}
                        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                        transition={{ type: "spring", stiffness: 60, damping: 20, delay: 0.2 }}
                        className="relative w-[80%] aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(251,191,36,0.3)] border border-amber-500/30 group"
                    >
                        {/* 수미상관의 피날레: 입자 소용돌이 효과 [cite: 2026-02-11] */}
                        <ParticleEffect type="swirl" count={60} duration={3} color="#fbbf24" />

                        <img
                            src={imageSrc}
                            alt="Final Arcana"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />

                        {/* 워터마크: 브랜드 아이덴티티 및 유저 소유권 박제 [cite: 2026-02-11] */}
                        <div className="absolute bottom-6 left-0 w-full text-center">
                            <p className="text-[10px] uppercase tracking-[0.25em] text-white/70 font-serif drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                Prism Arcana <span className="mx-2 text-amber-500">•</span> Created by {FIXED_NAME}
                            </p>
                        </div>
                    </motion.div>

                    {/* 액션 버튼 세트: 저장 및 공유 [cite: 2026-02-11] */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center gap-4 w-full"
                    >
                        <button
                            onClick={handleDownload}
                            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-amber-900/60 border border-amber-500/40 text-amber-100 hover:bg-amber-800 transition-all font-serif text-sm shadow-lg group"
                        >
                            <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                            이미지로 소장하기
                        </button>
                        <button
                            onClick={handleCopyLink}
                            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-white/5 border border-white/10 text-purple-100 hover:bg-white/10 transition-all font-serif text-sm group"
                        >
                            <Share2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                            {isCopied ? "복사 완료" : "링크 복사"}
                        </button>
                    </motion.div>

                    {/* 2026 Vision Flow: 보상형 광고 브릿지 [cite: 2026-02-11] */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        className="w-full pt-6 border-t border-white/10"
                    >
                        <button
                            onClick={onShowAd}
                            className="w-full flex items-center justify-between px-6 py-5 rounded-2xl bg-gradient-to-r from-purple-900/40 to-black border border-purple-500/30 text-left group hover:border-purple-400 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all"
                        >
                            <div className="flex flex-col">
                                <span className="text-[10px] text-purple-400 uppercase tracking-widest mb-1 font-bold">Exclusive Fate</span>
                                <span className="text-sm md:text-base text-purple-100 font-serif flex items-center gap-2">
                                    나의 2026년 운명의 카드 확인하기
                                    <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                                </span>
                            </div>
                            <span className="text-purple-400 group-hover:translate-x-2 transition-transform">→</span>
                        </button>
                    </motion.div>

                </div>
            </motion.div>
        </AnimatePresence>
    );
}