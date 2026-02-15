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
    const [showResultCard, setShowResultCard] = useState(false); // Step 3
    const [collectedElements, setCollectedElements] = useState<{ objects: string[], colors: string[] }>({ objects: [], colors: [] });
    const [ritualStep, setRitualStep] = useState<"name" | "birthdate" | "narrative" | "complete">("name");
    const [narrativeContent, setNarrativeContent] = useState<string | null>(null); // Step 4
    const { displayedText, isComplete } = useTypewriter(narrativeContent, 50);
    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingText, setLoadingText] = useState("당신의 운명을 인양하고 있습니다...");
    const [showResultModal, setShowResultModal] = useState(false); // Step 6
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [show2026Ad, setShow2026Ad] = useState(false); // Step 8
    const [adProgress, setAdProgress] = useState(0);
    const [showFinalFate, setShowFinalFate] = useState(false); // Step 9

    const messagesEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    const addMessage = (role: "ai" | "user", content: React.ReactNode) => {
        setMessages(prev => [...prev, { id: (Date.now() + Math.random()).toString(), role, content }]);
    };

    // Step 4 실행 함수
    const startInterpretation = async (card: ArcanaCard) => {
        setIsLoading(true);
        setNarrativeContent("운명을 읽어내고 있습니다...");
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

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;
        const userInput = input.trim();
        setInput("");
        addMessage("user", userInput);
        if (collectedElements.objects.length < 3) setCollectedElements(prev => ({ ...prev, objects: [...prev.objects, userInput] }));
        else if (collectedElements.colors.length < 2) setCollectedElements(prev => ({ ...prev, colors: [...prev.colors, userInput] }));
        setIsLoading(true);
        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tarotContext: tarotCard, mode: "workshop" }),
            });
            const data = await response.json();
            if (data.content) addMessage("ai", data.content);
        } finally { setIsLoading(false); }
    };

    const generateStainedGlass = async () => {
        setIsGenerating(true);
        try {
            const prompt = `Stained glass style, ${collectedElements.objects.join(", ")}, colors ${collectedElements.colors.join(", ")}, mystical, 8k`;
            const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) });
            const result = await response.json();
            if (result.image) { setGeneratedImage(result.image); setShowResultModal(true); }
        } finally { setIsGenerating(false); }
    };

    const handleShow2026Ad = () => {
        setShowResultModal(false);
        setShow2026Ad(true);
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5; setAdProgress(progress);
            if (progress >= 100) { clearInterval(interval); setShow2026Ad(false); setShowFinalFate(true); }
        }, 200);
    };

    return (
        <div className="flex flex-col h-screen w-full max-w-2xl mx-auto relative overflow-hidden bg-black">
            <AnimatePresence mode="wait">
                {ritualStep === "complete" && (
                    <motion.div key="workshop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center w-full h-full pt-[40px] px-6">
                        {/* Step 5: Grand Altar Aesthetics (80% scaling) [cite: 2026-02-16] */}
                        <div className="relative w-[80%] aspect-[2/3] mb-[40px] z-10 shadow-[0_0_50px_rgba(251,191,36,0.3)]">
                            <motion.div className="w-full h-full rounded-2xl border-2 border-amber-500/30 overflow-hidden relative">
                                <div className="absolute inset-0 mix-blend-overlay" style={{ background: collectedElements.colors.length > 0 ? `linear-gradient(45deg, ${collectedElements.colors[0]}, ${collectedElements.colors[1] || 'transparent'})` : 'transparent' }} />
                                {tarotCard && <img src={`/cards/${tarotCard.id}.jpg`} alt="Life Card" className="w-full h-full object-cover opacity-80" />}
                            </motion.div>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4 justify-center">
                            {[...collectedElements.objects, ...collectedElements.colors].map((item, i) => (
                                <motion.div key={i} layout initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs text-white/80 border border-white/20">
                                    {item} <X className="w-3 h-3 cursor-pointer" onClick={() => { }} />
                                </motion.div>
                            ))}
                        </div>
                        <div className="flex-1 w-full overflow-y-auto mb-4 scrollbar-hide" ref={messagesEndRef}>
                            {messages.map(msg => (
                                <div key={msg.id} className={cn("mb-4 flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                                    <div className={cn("max-w-[80%] px-4 py-2 rounded-xl text-sm", msg.role === "user" ? "bg-white/10 text-white" : "bg-amber-900/20 text-amber-100 border border-amber-500/20")}>{msg.content}</div>
                                </div>
                            ))}
                        </div>
                        {collectedElements.objects.length >= 3 && collectedElements.colors.length >= 2 && (
                            <button onClick={generateStainedGlass} className="mb-8 px-10 py-4 bg-amber-600 text-white rounded-full font-serif shadow-xl hover:scale-105 transition-transform">나만의 아르카나 완성하기</button>
                        )}
                        <form onSubmit={handleSendMessage} className="w-full pb-10 px-4"><input value={input} onChange={e => setInput(e.target.value)} placeholder="당신을 증명하는 상징을 들려주세요..." className="w-full bg-transparent border-b border-white/20 py-2 text-center text-white focus:outline-none focus:border-amber-500" /></form>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {ritualStep !== "complete" && (
                    <motion.div exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black p-10 text-center">
                        {ritualStep === "name" && (
                            <div key="name">
                                <h2 className="text-2xl font-serif text-amber-100 mb-8">당신의 이름을 어둠 속에 남겨주시겠습니까?</h2>
                                <input autoFocus value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (setRitualStep("birthdate"), setInput(""))} className="bg-transparent border-b border-amber-500/50 text-3xl text-center text-white focus:outline-none w-64" />
                            </div>
                        )}
                        {ritualStep === "birthdate" && (
                            <div key="birth">
                                <h2 className="text-2xl font-serif text-amber-100 mb-8">{USER_NAME_FIXED} 님, 우주가 새겨놓은 숫자는?</h2>
                                <input autoFocus maxLength={8} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => {
                                    if (e.key === 'Enter' && /^\d{8}$/.test(input)) {
                                        const card = calculateLifePathNumber(input);
                                        setTarotCard(card);
                                        setShowResultCard(true); // Step 3: Card Reveal first
                                        setInput("");
                                    }
                                }} className="bg-transparent border-b border-amber-500/50 text-3xl text-center text-white focus:outline-none w-64" placeholder="YYYYMMDD" />
                            </div>
                        )}
                        {ritualStep === "narrative" && (
                            <div key="narrative" className="max-w-md">
                                <p className="text-amber-100 font-serif leading-loose whitespace-pre-wrap">{displayedText}</p>
                                {isComplete && (
                                    <button onClick={() => {
                                        setRitualStep("complete");
                                        addMessage("ai", `${USER_NAME_FIXED} 님, 이제 이 투명한 도안 위로 당신만의 빛을 입힐 차례입니다. 상징적인 '사물' 하나를 들려주시겠어요?`);
                                    }} className="mt-10 px-8 py-3 border border-amber-500/40 text-amber-200 rounded-full hover:bg-amber-900/20 transition-all">나만의 인생 카드 만들기 <ChevronRight className="inline w-4 h-4 ml-1" /></button>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Step 3: ResultCard - Dismissal triggers Step 4 */}
            {showResultCard && tarotCard && (
                <ResultCard card={tarotCard} userName={USER_NAME_FIXED} onDismiss={() => {
                    setShowResultCard(false);
                    setRitualStep("narrative");
                    startInterpretation(tarotCard); // Step 4: Start AI Interpretation
                }} />
            )}

            {/* Step 6-7: ResultModal */}
            {showResultModal && generatedImage && (
                <ResultModal imageSrc={generatedImage} userName={USER_NAME_FIXED} onClose={() => setShowResultModal(false)} onShowAd={handleShow2026Ad} />
            )}

            {/* Step 8: Simulated Ad Wait */}
            <AnimatePresence>
                {show2026Ad && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-10 text-center">
                        <h3 className="text-xl font-serif text-purple-200 mb-6 animate-pulse">2026년의 운명을 인양하고 있습니다...</h3>
                        <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden"><motion.div className="h-full bg-purple-500" initial={{ width: 0 }} animate={{ width: `${adProgress}%` }} /></div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Step 9: Final Fate Card Reveal */}
            {showFinalFate && tarotCard && (
                <ResultCard card={tarotCard} userName={USER_NAME_FIXED} onDismiss={() => setShowFinalFate(false)} isFinal={true} />
            )}

            {isGenerating && <div className="absolute inset-0 z-[150] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-amber-100"><p className="mt-4 font-serif animate-pulse">{loadingText}</p></div>}
        </div>
    );
}