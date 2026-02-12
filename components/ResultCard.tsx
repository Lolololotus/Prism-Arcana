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

    // Variantes for Staggered Animation
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.5,
                delayChildren: 0.3
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with Blur */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                onClick={onDismiss}
            />

            {/* Main Card Container with 3D Flip Effect */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0, rotateY: 180 }}
                animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                exit={{ y: -100, opacity: 0, transition: { duration: 0.8 } }}
                transition={{
                    type: "spring",
                    stiffness: 60,
                    damping: 20,
                    duration: 1.5
                }}
                className="relative z-10 w-full max-w-sm aspect-[2/3] perspective-1000 group cursor-pointer"
                onClick={onDismiss}
            >
                {/* Gold/Hologram Glow Behind - Intensified */}
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/30 via-purple-500/20 to-transparent blur-3xl rounded-full scale-110 animate-pulse-slow" />

                {/* The Card Itself */}
                <div className="w-full h-full relative rounded-2xl overflow-hidden border border-amber-500/50 shadow-[0_0_50px_rgba(251,191,36,0.2)] bg-black/80 flex flex-col items-center text-center p-8 backdrop-blur-md">
                    {/* Decorative Frame */}
                    <div className="absolute inset-3 border border-white/5 rounded-xl pointer-events-none" />

                    {/* Card Content with Staggered Animation */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="flex flex-col items-center h-full justify-center gap-8 py-4"
                    >
                        {/* 1. Stained Glass Heart Symbol */}
                        <motion.div variants={itemVariants} className="relative w-48 h-48">
                            <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full animate-pulse-slow" />
                            {/* Fallback to Icon if image load fails or is missing (handled via error boundary or check, but here we assume img) */}
                            <img
                                src="/stained_glass_heart_prism.png"
                                alt="Stained Glass Heart"
                                className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(251,191,36,0.6)] relative z-10 transition-opacity duration-300"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                                    e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.add('block');
                                }}
                            />
                            {/* Fallback Icon (Hidden by default, shown via CSS if img fails) */}
                            <Heart className="hidden fallback-icon:block w-32 h-32 text-amber-500/50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </motion.div>

                        {/* 2. Card Name */}
                        <motion.div variants={itemVariants} className="space-y-2 relative z-20">
                            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-100 to-amber-400 font-serif drop-shadow-glow tracking-wider">
                                {card.id}. {card.name}
                            </h2>
                            <p className="text-amber-200/60 font-serif text-lg tracking-widest uppercase">{card.nameKr}</p>
                        </motion.div>

                        {/* 3. Keywords & Mintimal Divider */}
                        <motion.div variants={itemVariants} className="space-y-6">
                            <div className="w-8 h-[1px] bg-amber-500/50 mx-auto" />
                            <div className="flex flex-wrap gap-3 justify-center">
                                {card.keywords.slice(0, 3).map(kw => ( // Limit to 3 for minimalism
                                    <span key={kw} className="text-sm text-purple-200/80 font-serif tracking-wide">
                                        {kw}
                                    </span>
                                ))}
                            </div>
                        </motion.div>

                        {/* Touch Hint */}
                        <motion.div
                            variants={itemVariants}
                            className="absolute bottom-8 left-0 w-full text-center"
                        >
                            <p className="text-[10px] text-amber-500/40 animate-pulse tracking-[0.2em] uppercase">
                                Touch to listen
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
