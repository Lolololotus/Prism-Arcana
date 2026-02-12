"use client";

import React from "react";
import { motion } from "framer-motion";
import { X, Sparkles, Heart, Crown, Scale, Moon, Sun, Star, Zap, Anchor, Infinity, Feather, Key, Skull, Ghost, Link, Flame, Droplet, User, Gavel, Mountain } from "lucide-react";
import { ArcanaCard } from "@/lib/tarot";
import { cn } from "@/lib/utils";

interface ResultCardProps {
    card: ArcanaCard;
    userName: string;
    onReveal?: () => void; // Optional to avoid breaking if not passed immediately
    onDismiss: () => void;
}

export default function ResultCard({ card, userName, onReveal, onDismiss }: ResultCardProps) {
    React.useEffect(() => {
        if (onReveal) onReveal();
    }, [onReveal]);

    const getCardIcon = (id: number) => {
        const iconClass = "w-16 h-16 text-amber-200 animate-pulse";
        switch (id) {
            case 0: return <Feather className={iconClass} />; // The Fool
            case 1: return <Sparkles className={iconClass} />; // The Magician
            case 2: return <Moon className={iconClass} />; // High Priestess
            case 3: return <Crown className={iconClass} />; // The Empress
            case 4: return <Crown className={iconClass} />; // The Emperor
            case 5: return <Key className={iconClass} />; // The Hierophant
            case 6: return <Heart className={iconClass} />; // The Lovers
            case 7: return <Mountain className={iconClass} />; // The Chariot (Abstract) or Arrow
            case 8: return <Flame className={iconClass} />; // Strength
            case 9: return <User className={iconClass} />; // The Hermit
            case 10: return <Infinity className={iconClass} />; // Wheel of Fortune
            case 11: return <Scale className={iconClass} />; // Justice
            case 12: return <Anchor className={iconClass} />; // Hanged Man
            case 13: return <Skull className={iconClass} />; // Death
            case 14: return <Droplet className={iconClass} />; // Temperance
            case 15: return <Link className={iconClass} />; // The Devil
            case 16: return <Zap className={iconClass} />; // The Tower
            case 17: return <Star className={iconClass} />; // The Star
            case 18: return <Moon className={iconClass} />; // The Moon
            case 19: return <Sun className={iconClass} />; // The Sun
            case 20: return <Ghost className={iconClass} />; // Judgement
            case 21: return <Gavel className={iconClass} />; // The World (Gavel? Maybe Globe if available, else Sprout)
            default: return <Sparkles className={iconClass} />;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with Blur */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={onDismiss}
            />

            {/* Main Card Container with 3D Flip Effect */}
            <motion.div
                initial={{ scale: 0, opacity: 0, rotateY: 180 }}
                animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: -50 }}
                transition={{
                    type: "spring",
                    stiffness: 100,
                    damping: 20,
                    duration: 1.5
                }}
                className="relative z-10 w-full max-w-sm aspect-[2/3] perspective-1000 group"
            >
                {/* Gold/Hologram Glow Behind - Intensified */}
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-400 via-orange-300 to-white opacity-40 blur-3xl rounded-full scale-125 animate-pulse-slow mix-blend-screen" />
                <div className="absolute inset-0 bg-[conic-gradient(from_90deg_at_50%_50%,#000000_0%,#a855f7_50%,#fbbf24_100%)] mix-blend-color-dodge opacity-50 blur-2xl animate-spin-slow" />

                {/* The Card Itself - High Contrast Border */}
                <div className="w-full h-full relative rounded-2xl overflow-hidden border-2 border-amber-400/80 shadow-[0_0_80px_rgba(251,191,36,0.4)] bg-black/95 flex flex-col items-center text-center p-6">
                    {/* Decorative Frame */}
                    <div className="absolute inset-2 border border-white/10 rounded-xl pointer-events-none" />

                    {/* Card Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="flex flex-col items-center h-full justify-between py-4"
                    >
                        <div className="space-y-2">
                            <h3 className="text-amber-200 font-serif text-sm tracking-widest uppercase">The Destined Light</h3>
                            <h2 className="text-3xl font-bold text-white font-serif">{card.id}. {card.name}</h2>
                            <p className="text-purple-300 font-serif text-lg">{card.nameKr}</p>
                        </div>

                        {/* Dynamic Card Icon */}
                        <div className="flex-1 w-full flex items-center justify-center my-4">
                            <div className="w-32 h-32 rounded-full border-2 border-amber-500/30 flex items-center justify-center relative bg-gradient-to-b from-indigo-900 to-black">
                                {getCardIcon(card.id)}
                                <div className="absolute inset-0 rounded-full border border-white/20 animate-ping-slow" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm text-gray-300 leading-relaxed font-light">
                                <span className="text-amber-200 font-bold">{userName}</span> 님만을 위해 준비된, 눈부신 '{card.nameKr}' 카드가 도착했습니다.
                                <br />
                                이 빛의 조각들이 당신에게 어떤 이야기를 건네고 있나요?
                            </p>

                            <div className="flex flex-wrap gap-2 justify-center">
                                {card.keywords.map(kw => (
                                    <span key={kw} className="px-3 py-1 text-xs rounded-full bg-amber-900/20 text-amber-200 border border-amber-700/30">
                                        #{kw}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={onDismiss}
                            className="mt-6 px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/30 rounded-full text-white text-sm transition-all"
                        >
                            이야기 시작하기
                        </button>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
