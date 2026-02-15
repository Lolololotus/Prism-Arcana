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
    const [userName, setUserName] = useState(USER_NAME_FIXED);
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

    const { playReveal } = useSound();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const addMessage = (role: "ai" | "user", content: React.ReactNode) => {
        setMessages(prev => [...prev, { id: (Date.now() + Math.random()).toString(), role, content }]);
    };

    const triggerInitialGreeting = async (card: ArcanaCard) => {
        setIsLoading(true);
        setNarrativeContent("운명을 읽어내고 있습니다...");
        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tarotContext: card,
                    userName: USER_NAME_FIXED,
                    mode: "reveal"
                }),
            });
            const data = await response.json();
            if (data.content) setNarrativeContent(data.content);
        } catch (error) {
            setNarrativeContent("운명의 흐름이 잠시 끊겼습니다.");
        } finally {
            setIsLoading(false);
        }
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
                body: JSON.stringify({ tarotContext: tarotCard, collectedElements, mode: "workshop" }),
            });
            const data = await response.json();
            if (data.content) addMessage("ai", data.content);
        } catch (error) {
            addMessage("ai", "통신 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    const generateStainedGlass = async () => {
        setIsGenerating(true);
        const loadingTexts = ["당신의 운명을 인양하고 있습니다...", `${USER_NAME_FIXED} 님의 색채가 번져나갑니다...`, "아르카나가 형상화됩니다..."];
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
            if (progress >= 100) { clearInterval(interval); setShow2026Ad(false); setShowResultCard(true); }
        }, 250);
    };

    return (
        <div className="flex flex-col h-screen w-full max-w-2xl mx-auto relative overflow-hidden bg-black">
            <AnimatePresence mode="wait">
                {ritualStep === "complete" && (
                    <motion.div key="workshop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center w-full h-full pt-[80px] px-6">
                        <div className="relative w-[80%] aspect-[2/3] mb-[80px] z-10">
                            <motion.div className={cn("w-full h-full rounded-2xl border-2 border-amber-500/30 overflow-hidden shadow-2xl transition-all duration-700", collectedElements.objects.length > 0 && "shadow-[0_0_40px_rgba(251,191,36,0.4)] border-amber-500/60")}>
                                <div className="absolute inset-0 mix-blend-overlay transition-colors duration-1000" style={{ background: collectedElements.colors.length > 0 ? `linear-gradient(45deg, ${collectedElements.colors[0]}, ${collectedElements.colors[1] || 'transparent'})` : 'transparent' }} />
                                <div className="absolute inset-0 bg-black/20" />
                                {tarotCard && <img src={`/cards/${tarotCard.id}.jpg`} alt="Arcana" className="w-full h-full object-cover opacity-80" />}
                            </motion.div>
                            <ParticleEffect type="gather" color="#fbbf24" />
                        </div>

                        <div className="flex flex-wrap gap-2 mb-6 justify-center">
                            {[...collectedElements.objects, ...collectedElements.colors].map((item, i) => (
                                <motion.div key={i} layout initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full">
                                    <span className="text-xs text-white/80">{item}</span>
                                    <X className="w-3 h-3 text-white/40 cursor-pointer hover:text-red-400" onClick={() => handleRemoveItem(i < collectedElements.objects.length ? 'object' : 'color', item)} />
                                </motion.div>
                            ))}
                        </div>

                        {collectedElements.objects.length >= 3 && collectedElements.colors.length >= 2 && (
                            <motion.div variants={fadeVariants} initial="hidden" animate="visible" exit="exit" className="fixed top-10 z-[100] w-full px-6 flex justify-center">
                                <button onClick={generateStainedGlass} className="px-10 py-4 bg-amber-600 text-white rounded-full font-serif tracking-widest shadow-[0_0_30px_rgba(251,191,36,0.5)]">
                                    나만의 아르카나 완성하기
                                </button>
                            </motion.div>
                        )}

                        <div className="flex-1 w-full overflow-y-auto mb-4 scrollbar-hide" ref={messagesEndRef}>
                            {messages.map(msg => (
                                <div key={msg.id} className={cn("mb-4 flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                                    <div className={cn("max-w-[80%] px-4 py-2 rounded-xl text-sm", msg.role === "user" ? "bg-white/10 text-white" : "bg-amber-900/20 text-amber-100 border border-amber-500/20")}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleSendMessage} className="w-full pb-10 px-4">
                            <input value={input} onChange={e => setInput(e.target.value)} placeholder="당신을 증명하는 상징을 들려주세요..." className="w-full bg-transparent border-b border-white/20 py-2 text-center text-white focus:outline-none focus:border-amber-500" />
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {ritualStep !== "complete" && (
                    <motion.div exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black p-10 text-center">
                        {ritualStep === "name" && (
                            <motion.div key="name" variants={fadeVariants} initial="hidden" animate="visible">
                                <h2 className="text-2xl font-serif text-amber-100 mb-8">당신의 이름을 어둠 속에 남겨주시겠습니까?</h2>
                                <input autoFocus value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (setUserName(USER_NAME_FIXED), setInput(""), setRitualStep("birthdate"))} className="bg-transparent border-b border-amber-500/50 text-3xl text-center text-white focus:outline-none w-64" />
                            </motion.div>
                        )}
                        {ritualStep === "birthdate" && (
                            <motion.div key="birth" variants={fadeVariants} initial="hidden" animate="visible">
                                <h2 className="text-2xl font-serif text-amber-100 mb-8">{USER_NAME_FIXED} 님, 우주가 새겨놓은 숫자는?</h2>
                                <input autoFocus maxLength={8} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => {
                                    if (e.key === 'Enter' && /^\d{8}$/.test(input)) {
                                        const card = calculateLifePathNumber(input);
                                        setTarotCard(card);
                                        setInput("");
                                        playReveal();
                                        setShowResultCard(true);
                                        triggerInitialGreeting(card);
                                    }
                                }} className="bg-transparent border-b border-amber-500/50 text-3xl text-center text-white focus:outline-none w-64 tracking-widest" placeholder="YYYYMMDD" />
                            </motion.div>
                        )}
                        {ritualStep === "narrative" && (
                            <motion.div key="narrative" variants={fadeVariants} initial="hidden" animate="visible" className="max-w-md">
                                <p className="text-amber-100 font-serif leading-loose whitespace-pre-wrap">{displayedText}</p>
                                {isComplete && (
                                    <button onClick={() => setRitualStep("complete")} className="mt-10 px-8 py-3 border border-amber-500/40 text-amber-200 rounded-full hover:bg-amber-900/20 transition-all">
                                        나만의 인생 카드 만들기 <ChevronRight className="inline w-4 h-4 ml-1" />
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {showResultModal && generatedImage && <ResultModal imageSrc={generatedImage} userName={USER_NAME_FIXED} onClose={() => setShowResultModal(false)} onShowAd={handleShow2026Ad} />}
            <AnimatePresence>
                {show2026Ad && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-10 text-center">
                        <h3 className="text-xl font-serif text-purple-200 mb-6 animate-pulse">당신의 운명을 인양하고 있습니다...</h3>
                        <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
                            <motion.div className="h-full bg-purple-500" initial={{ width: 0 }} animate={{ width: `${adProgress}%` }} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {isGenerating && <div className="absolute inset-0 z-[150] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-amber-100"><ParticleEffect type="swirl" color="#fbbf24" /><p className="mt-4 font-serif animate-pulse">{loadingText}</p></div>}
            {showResultCard && tarotCard && <ResultCard card={tarotCard} userName={USER_NAME_FIXED} onDismiss={() => { setShowResultCard(false); setRitualStep("narrative"); }} />}
        </div>
    );
}