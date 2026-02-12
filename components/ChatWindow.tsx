"use client";

import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, Sparkles, X, Play, ShieldCheck, Lock, Unlock, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateLifePathNumber, ArcanaCard } from "@/lib/tarot";
import RewardAdModal from "./RewardAdModal";
import { initializePayment, requestPayment } from "@/lib/payment";
import OrderComingSoon from "./OrderComingSoon";

interface Message {
    id: string;
    role: "ai" | "user";
    content: React.ReactNode;
    timestamp: Date;
}

interface ChatWindowProps {
    initialMessage?: string;
}

export default function ChatWindow({
    initialMessage = "안녕하세요, 로터스 님. 당신의 우주가 담긴 숫자를 알려주세요.",
}: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState<"birthdate" | "chat">("birthdate");
    const [tarotCard, setTarotCard] = useState<ArcanaCard | null>(null);
    const [moodColor, setMoodColor] = useState("from-gray-900 via-purple-900 to-black");
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showAd, setShowAd] = useState(false);
    const [isHighResUnlocked, setIsHighResUnlocked] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [fillingStep, setFillingStep] = useState(0); // 0: Line Art, 1: Coloring, 2: Complete
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        initializePayment(); // Load Portone Script
    }, []);

    useEffect(() => {
        // Initial greeting
        const timer = setTimeout(() => {
            addMessage("ai", initialMessage);
        }, 500);
        return () => clearTimeout(timer);
    }, [initialMessage]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const addMessage = (role: "ai" | "user", content: React.ReactNode) => {
        setMessages((prev) => [
            ...prev,
            {
                id: Date.now().toString() + Math.random().toString(),
                role,
                content,
                timestamp: new Date(),
            },
        ]);
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userInput = input.trim();
        setInput("");
        updateMood(userInput); // Update mood based on input
        addMessage("user", userInput);

        if (step === "birthdate") {
            setIsLoading(true);
            // Simulate processing for birthdate (or keep local if strictly calculating)
            setTimeout(() => {
                setIsLoading(false);
                processInput(userInput);
            }, 1000);
        } else {
            // Chat phase
            setIsLoading(true);
            try {
                const response = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        messages: messages.map(msg => ({ role: msg.role, content: typeof msg.content === 'string' ? msg.content : '...' })), // Send string content
                        tarotContext: tarotCard
                    }),
                });

                const data = await response.json();

                if (data.role === 'ai') {
                    // Check for JSON block in response
                    const content = data.content;
                    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);

                    if (jsonMatch) {
                        const retrievalData = JSON.parse(jsonMatch[1]);
                        console.log("Retrieval Complete:", retrievalData);

                        const cleanContent = content.replace(/```json\n[\s\S]*?\n```/, "").trim();
                        addMessage("ai", cleanContent);

                        // Parse for "Step 2: Inquiry" or filling feedback to trigger visual effects
                        if (cleanContent.includes("스며듭니다") || cleanContent.includes("채워")) {
                            setFillingStep(prev => Math.min(prev + 1, 3));
                        }

                        // Start Image Generation
                        if (retrievalData.objects && retrievalData.primary_color) {
                            // Full Retrieval Complete
                            generateStainedGlass(retrievalData);
                        } else if (retrievalData.target_object) {
                            // Intermediate Object Extraction
                            console.log("Target Object Detected:", retrievalData.target_object);
                        }
                    } else {
                        addMessage("ai", content);
                    }
                }
            } catch (error) {
                console.error(error);
                addMessage("ai", "오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const processInput = (text: string) => {
        if (step === "birthdate") {
            const birthdateRegex = /^\d{8}$/;
            if (!birthdateRegex.test(text.replace(/\s/g, ""))) {
                addMessage(
                    "ai",
                    "죄송합니다. 생년월일은 8자리 숫자로 입력해주세요. (예: 19900101)"
                );
                return;
            }

            try {
                const card = calculateLifePathNumber(text);
                setTarotCard(card); // Store card context
                displayTarotResult(card);
                setStep("chat");

                // Trigger initial AI greeting
                setTimeout(() => {
                    triggerInitialGreeting(card);
                }, 500);
            } catch (error) {
                addMessage("ai", "계산 중 오류가 발생했습니다. 다시 시도해주세요.");
            }
        }
    };

    const displayTarotResult = (card: ArcanaCard) => {
        const resultMessage = (
            <div className="flex flex-col items-center gap-4 p-4 border border-purple-500/30 rounded-lg bg-black/40 backdrop-blur-sm">
                <div className="text-xl text-purple-300 font-serif">당신의 인생 카드</div>
                <div className="text-4xl font-bold text-white tracking-widest uppercase mb-2">
                    {card.id}. {card.name}
                </div>
                <div className="text-2xl text-purple-200 font-serif mb-4">
                    {card.nameKr}
                </div>
                <div className="text-sm text-gray-300 text-center leading-relaxed max-w-md">
                    {card.meaning}
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                    {card.keywords.map(kw => (
                        <span key={kw} className="px-2 py-1 text-xs rounded-full bg-purple-900/50 text-purple-200 border border-purple-700/50">
                            #{kw}
                        </span>
                    ))}
                </div>
            </div>
        );

        addMessage("ai", resultMessage);
    };

    const triggerInitialGreeting = async (card: ArcanaCard) => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [], // Empty history for initial greeting
                    tarotContext: card,
                    userName: "Lotus" // Hardcoded for now per request
                }),
            });

            const data = await response.json();
            if (data.role === 'ai') {
                addMessage("ai", data.content);
            }
        } catch (error) {
            console.error(error);
            addMessage("ai", "지미니가 당신의 사유를 읽는 데 어려움을 겪고 있습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    /* Mood Analysis Simulation */
    const updateMood = (text: string) => {
        // Simple sentiment simulation based on keywords
        if (text.includes("사랑") || text.includes("좋아") || text.includes("행복")) {
            setMoodColor("from-pink-900 via-red-900 to-black");
        } else if (text.includes("슬픔") || text.includes("우울") || text.includes("힘들")) {
            setMoodColor("from-blue-900 via-gray-900 to-black");
        } else if (text.includes("꿈") || text.includes("미래") || text.includes("희망")) {
            setMoodColor("from-indigo-900 via-purple-900 to-black");
        } else {
            setMoodColor("from-gray-900 via-purple-900 to-black");
        }
    };

    const generateStainedGlass = async (data: any) => {
        setIsGenerating(true);
        try {
            // Prompt Engineering for Stained Glass
            const prompt = `
                Stained glass artwork of ${data.card_name}.
                Central elements: ${data.objects.join(", ")}.
                Primary colors: ${data.primary_color}.
                Atmosphere: ${data.mood}.
                Intricate lead lines, vibrant translucent glass, glowing light from behind.
                Masterpiece, 8k resolution, highly detailed texture.
                No text, no watermark, no realistic photo.
            `;

            const response = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            });

            const result = await response.json();
            if (result.image) {
                setGeneratedImage(result.image);
                addMessage("ai", "당신의 사유가 빛으로 형상화되었습니다.");
            } else {
                throw new Error(result.error || "Image generation failed");
            }
        } catch (error) {
            console.error(error);
            addMessage("ai", "이미지 생성 중 오류가 발생했습니다. (Google Imagen API 확인 필요)");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className={cn(
            "flex flex-col h-[80vh] w-full max-w-2xl mx-auto rounded-2xl overflow-hidden relative transition-colors duration-1000 glass-panel",
        )}>
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between glass-glow">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <span className="font-serif text-lg text-purple-100 tracking-wider">Jimini</span>
                </div>
                <div className="text-xs text-purple-300 font-serif">Prism Arcana v0.2</div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-purple-900/50">
                <AnimatePresence>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={cn(
                                "flex w-full",
                                msg.role === "user" ? "justify-end" : "justify-start"
                            )}
                        >
                            <div
                                className={cn(
                                    "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-lg backdrop-blur-sm border",
                                    msg.role === "user"
                                        ? "bg-purple-900/40 text-purple-50 border-purple-500/30 rounded-br-none"
                                        : "bg-slate-900/60 text-slate-100 border-amber-500/10 rounded-bl-none font-serif"
                                )}
                            >
                                {msg.content}
                            </div>
                        </motion.div>
                    ))}
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-start w-full"
                        >
                            <div className="bg-slate-900/60 p-4 rounded-2xl rounded-bl-none border border-amber-500/10 flex gap-2 items-center">
                                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                                <span className="text-xs text-purple-300 font-serif">지미니가 당신의 사유를 읽고 있습니다...</span>
                            </div>
                        </motion.div>
                    )}
                    {isGenerating && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-center w-full py-4"
                        >
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-400 rounded-full animate-spin"></div>
                                <span className="text-xs text-amber-200 font-serif animate-pulse">Forging Stained Glass...</span>
                            </div>
                        </motion.div>
                    )}

                    {/* Visual Anchoring: Line Art / Progress */}
                    {tarotCard && !generatedImage && !isGenerating && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full flex flex-col items-center gap-4 py-4"
                        >
                            <div className="relative group rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black/50 p-4">
                                <img
                                    src="/stained-glass-placeholder.svg"
                                    alt="Base Line Art"
                                    className={cn(
                                        "max-w-xs w-full h-auto object-contain transition-all duration-1000",
                                        fillingStep > 0 ? "opacity-100 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" : "opacity-60 grayscale"
                                    )}
                                />
                                {fillingStep > 0 && (
                                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 via-transparent to-amber-500/20 animate-pulse mix-blend-overlay" />
                                )}
                                <div className="absolute bottom-2 right-2 text-[10px] text-white/30 font-serif">
                                    {fillingStep === 0 ? "Stage 1: Line Art" : "Stage 2: Filling Soul..."}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {generatedImage && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full flex flex-col items-center gap-4 py-4"
                        >
                            <div className="relative group rounded-xl overflow-hidden shadow-2xl border-2 border-amber-500/50">
                                <img
                                    src={generatedImage}
                                    alt="Stained Glass Result"
                                    className={cn(
                                        "max-w-xs md:max-w-sm w-full h-auto object-cover transition-all duration-700",
                                        isHighResUnlocked ? "blur-0" : "blur-sm"
                                    )}
                                />
                                {!isHighResUnlocked && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                                        <Lock className="w-8 h-8 text-white/70 mb-2" />
                                        <button
                                            onClick={() => setShowAd(true)}
                                            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 text-white font-serif rounded-full shadow-lg transition-all flex items-center gap-2 border border-white/20"
                                        >
                                            <Play className="w-4 h-4 fill-current" />
                                            Unlock High Res
                                        </button>
                                        <p className="text-xs text-white/50 mt-2">Watch a short brand film</p>
                                    </div>
                                )}
                            </div>

                            {isHighResUnlocked && (
                                <div className="flex gap-3">
                                    <button className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-100/80 border border-white/10 rounded-xl text-sm font-sans transition-colors flex items-center gap-2">
                                        <Unlock className="w-4 h-4" />
                                        Save Image
                                    </button>
                                    <button
                                        onClick={() => setShowOrderModal(true)}
                                        className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white border border-amber-400/30 rounded-xl text-sm font-bold shadow-lg shadow-amber-900/20 transition-all flex items-center gap-2"
                                    >
                                        <CreditCard className="w-4 h-4" />
                                        Order Keyring
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            <RewardAdModal
                isOpen={showAd}
                onClose={() => setShowAd(false)}
                onReward={() => {
                    setIsHighResUnlocked(true);
                    setShowAd(false);
                    addMessage("ai", "고해상도 이미지가 해금되었습니다. 이제 실물 키링으로 소장하실 수 있습니다.");
                }}
            />

            <OrderComingSoon
                isOpen={showOrderModal}
                onClose={() => setShowOrderModal(false)}
            />

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 flex flex-col gap-2 bg-slate-900/30">
                {step === "chat" && (
                    <div className="flex items-center gap-2 px-1">
                        <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
                        <span className="text-xs text-purple-300/70 font-serif">지미니가 당신의 이야기를 기다리고 있어요...</span>
                    </div>
                )}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={step === "birthdate" ? "YYYYMMDD (예: 19900101)" : "당신의 이야기를 들려주세요..."}
                        className="flex-1 bg-slate-950/50 border border-purple-500/30 rounded-xl px-4 py-3 text-purple-100 placeholder-purple-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/50 transition-all font-sans"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="p-3 bg-purple-900/50 hover:bg-purple-800/50 border border-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-amber-200 transition-colors shadow-lg"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </form>
        </div>
    );
}
