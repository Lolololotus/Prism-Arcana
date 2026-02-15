"use client";

import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { Sparkles, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateLifePathNumber, ArcanaCard } from "@/lib/tarot";
import { useSound } from "@/hooks/useSound";
import { useTypewriter } from "@/hooks/useTypewriter";
import ResultCard from "./ResultCard";
import ResultModal from "./ResultModal";
import ParticleEffect from "./ParticleEffect";

interface Message {
    id: string;
    role: "ai" | "user";
    content: React.ReactNode;
}

const fadeVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
};

export default function ChatWindow() {
    const USER_NAME_FIXED = "로터스";
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [tarotCard, setTarotCard] = useState<ArcanaCard | null>(null);
    const [showResultCard, setShowResultCard] = useState(false);
    const [collectedElements, setCollectedElements] = useState<{ objects: string[], colors: string[] }>({ objects: [], colors: [] });
    const [ritualStep, setRitualStep] = useState<"name" | "birthdate" | "narrative" | "complete">("name");
    const [narrativeContent, setNarrativeContent] = useState<string | null>(null);
    const { displayedText, isComplete } = useTypewriter(narrativeContent, 50);
    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingText, setLoadingText] = useState("당신의 운명을 인양하고 있습니다...");
    const [showResultModal, setShowResultModal] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [show2026Ad, setShow2026Ad] = useState(false);
    const [adProgress, setAdProgress] = useState(0);
    const [showFinalFate, setShowFinalFate] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    const addMessage = (role: "ai" | "user", content: React.ReactNode) => {
        setMessages(prev => [...prev, { id: (Date.now() + Math.random()).toString(), role, content }]);
    };

    const startInterpretation = async (card: ArcanaCard) => {
        setIsLoading(true);
        setNarrativeContent(null);
        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tarotContext: card, mode: "reveal" }),
            });
            const data = await response.json();
            if (data.content) setNarrativeContent(data.content);
        } finally { setIsLoading(false); }
    };

    const handleRemoveItem = (type: 'object' | 'color', value: string) => {
        setCollectedElements(prev => ({
            ...prev,
            objects: type === 'object' ? prev.objects.filter(i => i !== value) : prev.objects,
            colors: type === 'color' ? prev.colors.filter(i => i !== value) : prev.colors
        }));
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;
        const userInput = input.trim();
        setInput("");
        addMessage("user", userInput);

        if (collectedElements.objects.length < 3) {
            setCollectedElements(prev => ({ ...prev, objects: [...prev.objects, userInput] }));
        } else if (collectedElements.colors.length < 2) {
            setCollectedElements(prev => ({ ...prev, colors: [...prev.colors, userInput] }));
        }

        setIsLoading(true);
        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tarotContext: tarotCard, mode: "workshop" }),
            });
            const data = await response.json();
            if (data.content) addMessage("ai", data.content);
        } finally {
            setIsLoading(false);
        }
    };

    const generateStainedGlass = async () => {
        setIsGenerating(true);
        const loadingTexts = ["당신의 운명을 인양하고 있습니다...", "색채가 번져나갑니다...", "아르카나가 형상화됩니다..."];
        let idx = 0;
        const interval = setInterval(() => { setLoadingText(loadingTexts[++idx % 3]); }, 2000);
        try {
            const prompt = `Stained glass style, ${collectedElements.objects.join(", ")}, colors ${collectedElements.colors.join(", ")}, mystical, 8k`;
            const response = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            });
            const result = await response.json();
            if (result.image) { setGeneratedImage(result.image); setShowResultModal(true); }
        } finally { clearInterval(interval); setIsGenerating(false); }
    };

    const handleShow2026Ad = () => {
        setShowResultModal(false);
        setShow2026Ad(true);
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5; setAdProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                setShow2026Ad(false);
                setShowFinalFate(true);
            }
        }, 200);
    };

    return (
        <div className="flex flex-col h-screen w-full max-w-2xl mx-auto relative overflow-hidden bg-black font-serif text-white">
            <AnimatePresence mode="wait">
                {ritualStep === "complete" && (
                    <motion.div key="workshop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
                        {/* 1. 고정 상단: 카드 시각화 (크기 적정화) */}
                        <div className="flex-none pt-10 pb-4 flex flex-col items-center bg-black/50 backdrop-blur-sm border-b border-white/5">
                            <div className="relative w-40 aspect-[2/3] shadow-[0_0_30px_rgba(251,191,36,0.2)] rounded-lg overflow-hidden border border-white/10">
                                {tarotCard && <img src={`/cards/${tarotCard.id}.jpg`} alt="Life Card" className="w-full h-full object-cover opacity-80" onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/400x600/000000/fbbf24?text=Fate"; }} />}
                                <div className="absolute inset-0 mix-blend-overlay" style={{ background: collectedElements.colors.length > 0 ? `linear-gradient(45deg, ${collectedElements.colors[0]}, ${collectedElements.colors[1] || 'transparent'})` : 'transparent' }} />
                            </div>
                            {/* 파편 UI */}
                            <div className="flex flex-wrap gap-2 mt-4 px-4 justify-center">
                                {[...collectedElements.objects, ...collectedElements.colors].map((item, i) => (
                                    <div key={i} className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] text-amber-200/80">
                                        {item}
                                        <X className="w-2.5 h-2.5 cursor-pointer hover:text-red-400" onClick={() => handleRemoveItem(i < collectedElements.objects.length ? 'object' : 'color', item)} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 2. 중앙: 채팅 로그 */}
                        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide space-y-6" ref={messagesEndRef}>
                            {messages.map(msg => (
                                <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                                    <div className={cn("max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm", msg.role === "user" ? "bg-white/10" : "bg-amber-900/10 border border-amber-500/10 text-amber-50")}>{msg.content}</div>
                                </div>
                            ))}
                        </div>

                        {/* 3. 하단: 입력창 */}
                        <div className="flex-none p-6 pb-10">
                            {collectedElements.objects.length >= 3 && collectedElements.colors.length >= 2 && (
                                <button onClick={generateStainedGlass} className="w-full mb-6 py-4 bg-amber-600/90 text-white rounded-full shadow-lg flex items-center justify-center gap-2 hover:bg-amber-600 transition-all font-serif">
                                    <Sparkles className="w-4 h-4" /> 나만의 아르카나 완성하기
                                </button>
                            )}
                            <form onSubmit={handleSendMessage}>
                                <input value={input} onChange={e => setInput(e.target.value)} placeholder="당신을 증명하는 상징을 들려주세요..." className="w-full bg-white/5 border border-white/10 rounded-full py-4 px-6 text-center focus:outline-none focus:border-amber-500/50 transition-all placeholder:text-white/20 font-serif" />
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 초기 진입 단계 [cite: 2026-02-16] */}
            <AnimatePresence mode="wait">
                {ritualStep !== "complete" && (
                    <motion.div exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black p-10 text-center font-serif">
                        {ritualStep === "name" && (
                            <div key="name">
                                <h2 className="text-2xl text-amber-100 mb-8">당신의 이름을 어둠 속에 남겨주시겠습니까?</h2>
                                <input autoFocus value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (setRitualStep("birthdate"), setInput(""))} className="bg-transparent border-b border-amber-500/50 text-3xl text-center focus:outline-none w-64 font-serif" />
                            </div>
                        )}
                        {ritualStep === "birthdate" && (
                            <div key="birth">
                                <h2 className="text-2xl text-amber-100 mb-8">{USER_NAME_FIXED} 님, 우주가 새겨놓은 숫자는?</h2>
                                <input autoFocus maxLength={8} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => {
                                    if (e.key === 'Enter' && /^\d{8}$/.test(input)) {
                                        const card = calculateLifePathNumber(input);
                                        setTarotCard(card);
                                        setShowResultCard(true);
                                        setInput("");
                                    }
                                }} className="bg-transparent border-b border-amber-500/50 text-3xl text-center focus:outline-none w-64 font-serif" placeholder="YYYYMMDD" />
                            </div>
                        )}
                        {ritualStep === "narrative" && (
                            <div key="narrative" className="max-w-md">
                                {isLoading && !narrativeContent ? (
                                    <p className="text-amber-100 animate-pulse">운명을 인양하고 있습니다...</p>
                                ) : (
                                    <>
                                        <p className="text-amber-100 leading-loose whitespace-pre-wrap">{displayedText}</p>
                                        {isComplete && narrativeContent && (
                                            <button onClick={() => {
                                                setRitualStep("complete");
                                                addMessage("ai", `${USER_NAME_FIXED} 님, 이제 이 투명한 도안 위로 당신만의 빛을 입힐 차례입니다. 상징적인 '사물' 하나를 들려주시겠어요?`);
                                            }} className="mt-10 px-8 py-3 border border-amber-500/40 text-amber-200 rounded-full hover:bg-amber-900/20 transition-all">나만의 인생 카드 만들기 <ChevronRight className="inline w-4 h-4 ml-1" /></button>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {showResultCard && tarotCard && <ResultCard card={tarotCard} userName={USER_NAME_FIXED} onDismiss={() => { setShowResultCard(false); setRitualStep("narrative"); startInterpretation(tarotCard); }} />}

            {showResultModal && generatedImage && (
                <ResultModal imageSrc={generatedImage} userName={USER_NAME_FIXED} onClose={() => setShowResultModal(false)} onShowAd={handleShow2026Ad} />
            )}

            <AnimatePresence>
                {show2026Ad && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-10 text-center font-serif">
                        <h3 className="text-xl text-purple-200 mb-6 animate-pulse">2026년의 운명을 인양하고 있습니다...</h3>
                        <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
                            <motion.div className="h-full bg-purple-500" initial={{ width: 0 }} animate={{ width: `${adProgress}%` }} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {showFinalFate && tarotCard && (
                <ResultCard card={tarotCard} userName={USER_NAME_FIXED} onDismiss={() => setShowFinalFate(false)} isFinal={true} />
            )}

            {isGenerating && <div className="absolute inset-0 z-[150] bg-black/80 flex flex-col items-center justify-center"><p className="text-amber-100 animate-pulse font-serif">{loadingText}</p></div>}
        </div>
    );
}