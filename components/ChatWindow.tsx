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
    const [isTyping, setIsTyping] = useState(false);
    const [step, setStep] = useState<"birthdate" | "chat">("birthdate");
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
        if (!input.trim()) return;

        const userInput = input.trim();
        setInput("");
        addMessage("user", userInput);
        setIsTyping(true);

        // Simulate AI processing
        setTimeout(() => {
            setIsTyping(false);
            processInput(userInput);
        }, 1000);
    };

    const processInput = (text: string) => {
        if (step === "birthdate") {
            // Basic validation for 8 digits
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
                displayTarotResult(card);
                setStep("chat"); // Move to next phase (placeholder for now)
            } catch (error) {
                addMessage("ai", "계산 중 오류가 발생했습니다. 다시 시도해주세요.");
            }
        } else {
            // Fallback for Phase 2 (Conversation) - D-5 Scope: Just echo or placeholder
            addMessage("ai", "당신의 사유를 더 깊이 들여다보고 있습니다... (AI 연동 준비 중)");
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

        // Follow up message
        setTimeout(() => {
            addMessage("ai", "이 카드는 당신의 영혼이 지닌 고유한 빛깔을 의미합니다. 이 결과에 대해 어떻게 생각하시나요?");
        }, 1500);
    };

    return (
        <div className="flex flex-col h-[80vh] w-full max-w-2xl mx-auto bg-gray-900/80 rounded-2xl shadow-2xl overflow-hidden border border-gray-700 backdrop-blur-md relative">
            {/* Header */}
            <div className="p-4 border-b border-gray-700 bg-black/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <span className="font-serif text-lg text-gray-100 tracking-wider">Jimini</span>
                </div>
                <div className="text-xs text-gray-500">Prism Arcana v0.1</div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700">
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
                                    "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-md",
                                    msg.role === "user"
                                        ? "bg-purple-600 text-white rounded-br-none"
                                        : "bg-gray-800 text-gray-100 rounded-bl-none border border-gray-700"
                                )}
                            >
                                {msg.content}
                            </div>
                        </motion.div>
                    ))}
                    {isTyping && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-start w-full"
                        >
                            <div className="bg-gray-800 p-4 rounded-2xl rounded-bl-none border border-gray-700 flex gap-1">
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 bg-black/50 border-t border-gray-700 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={step === "birthdate" ? "생년월일 8자리를 입력하세요 (예: 19900101)" : "메시지를 입력하세요..."}
                    className="flex-1 bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-sans"
                />
                <button
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    className="p-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white transition-colors shadow-lg shadow-purple-900/20"
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
}
