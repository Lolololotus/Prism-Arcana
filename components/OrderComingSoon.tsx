"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Mail, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderComingSoonProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function OrderComingSoon({ isOpen, onClose }: OrderComingSoonProps) {
    const [email, setEmail] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        console.log("Email captured for notification:", email);
        setIsSubmitted(true);
        setIsLoading(false);
        setEmail("");
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop with Blur */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
                    >
                        {/* Modal Content */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/20 shadow-2xl bg-black/80"
                        >
                            {/* Stained Glass Texture Background Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-black/90 z-0 pointer-events-none" />

                            {/* Decorative Elements for "Veiled" feel */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 z-20 p-2 text-white/50 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="relative z-10 p-8 flex flex-col items-center text-center">
                                <div className="mb-6 p-4 rounded-full bg-white/5 border border-white/10 shadow-inner">
                                    <Lock className="w-8 h-8 text-purple-300/80" />
                                </div>

                                <h2 className="text-2xl font-serif text-white mb-2 tracking-wide flex items-center justify-center gap-2">
                                    <Sparkles className="w-5 h-5 text-amber-300" />
                                    <span>Coming Soon</span>
                                    <Sparkles className="w-5 h-5 text-amber-300" />
                                </h2>

                                <p className="text-purple-200/80 mb-8 leading-relaxed font-light font-serif">
                                    The path from the stars to the physical realm is still forming.
                                    <br />
                                    <span className="text-sm mt-3 block opacity-70 font-sans">
                                        We are crafting the Stained Glass Keyring with the utmost care.
                                        Be the first to know when the portal opens.
                                    </span>
                                </p>

                                {!isSubmitted ? (
                                    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="Enter your email"
                                                required
                                                className="w-full bg-black/40 border border-purple-500/30 rounded-xl pl-10 pr-4 py-3 text-purple-100 placeholder-purple-500/50 focus:outline-none focus:border-amber-400/50 transition-all font-sans"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-serif rounded-xl shadow-lg shadow-purple-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 flex items-center justify-center gap-2"
                                        >
                                            {isLoading ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                "Notify Me When Ready"
                                            )}
                                        </button>
                                    </form>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="w-full bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-200 text-sm"
                                    >
                                        <p className="font-semibold mb-1">Thank you!</p>
                                        <p className="opacity-80">You will be notified as soon as the collection drops.</p>
                                        <button
                                            onClick={onClose}
                                            className="mt-3 text-xs underline hover:text-white transition-colors"
                                        >
                                            Close
                                        </button>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
