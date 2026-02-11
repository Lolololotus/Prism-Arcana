"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles } from "lucide-react";
import { calculateLifePathNumber, ArcanaCard } from "@/lib/tarot";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

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
    const messagesEndRef = useRef<HTMLDivElement>(null);

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
                        console.log("Retrieval Complete:", JSON.parse(jsonMatch[1]));
                        // Potentially strip JSON from display or handle "Phase 3" transition here
                        const cleanContent = content.replace(/```json\n[\s\S]*?\n```/, "").trim();
                        addMessage("ai", cleanContent);
                        // TODO: Transition to Image Generation Phase
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

        // Follow up message - Removed hardcoded message, now handled by triggerInitialGreeting
        // setTimeout(() => {
        //     addMessage("ai", "이 카드는 당신의 영혼이 지닌 고유한 빛깔을 의미합니다. 이 결과에 대해 어떻게 생각하시나요?");
        // }, 1500);
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

    return (
        <div className={cn(
            "flex flex-col h-[80vh] w-full max-w-2xl mx-auto rounded-2xl overflow-hidden relative transition-colors duration-1000 glass-panel",
            // moodColor - removed to respect design spec "Deep Navy to Purple" fixed gradient, or blend it. 
            // User asked for "Deep Navy to Purple" background. 
            // Phase 2 mood logic might conflict with "Deep Navy". I will keep mood logic but make it subtle overlay or border.
            // For now, let's respect the "glass-panel" look which has its own background.
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
                                <span className="text-xs text-purple-300 font-serif">Jimini is reading your thoughts...</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 flex gap-2 bg-slate-900/30">
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
            </form>
        </div>
    );
}
