"use client";

import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Languages, Sparkles, X, Diamond, Circle } from "lucide-react"; // 슬롯 아이콘 추가 [cite: 2026-02-16]
import { cn } from "@/lib/utils";
import { calculateLifePathNumber, ArcanaCard } from "@/lib/tarot";
import { useTypewriter } from "@/hooks/useTypewriter";
import ResultCard from "./ResultCard";
import ResultModal from "./ResultModal";

interface Message { id: string; role: "ai" | "user"; content: React.ReactNode; }

export default function ChatWindow() {
    const [lang, setLang] = useState<"ko" | "en">("ko");
    const USER_NAME = lang === "ko" ? "로터스" : "Lotus";

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [tarotCard, setTarotCard] = useState<ArcanaCard | null>(null);
    const [showResultCard, setShowResultCard] = useState(false);
    const [collectedElements, setCollectedElements] = useState<{ objects: string[], colors: string[] }>({ objects: [], colors: [] });
    const [ritualStep, setRitualStep] = useState<"name" | "birthdate" | "narrative" | "complete">("name");
    const [narrativeContent, setNarrativeContent] = useState<string | null>(null);
    const { displayedText, isComplete } = useTypewriter(narrativeContent, 40);

    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingText, setLoadingText] = useState("");
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
        setIsLoading(true); setNarrativeContent(null);
        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tarotContext: card, mode: "reveal", lang }),
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

        if (collectedElements.objects.length < 3) setCollectedElements(prev => ({ ...prev, objects: [...prev.objects, userInput] }));
        else if (collectedElements.colors.length < 2) setCollectedElements(prev => ({ ...prev, colors: [...prev.colors, userInput] }));

        setIsLoading(true);
        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tarotContext: tarotCard, mode: "workshop", lang }),
            });
            const data = await response.json();
            if (data.content) addMessage("ai", data.content);
        } finally { setIsLoading(false); }
    };

    const generateStainedGlass = async () => {
        setIsGenerating(true);
        const loadingTexts = lang === "ko"
            ? ["당신의 운명을 인양하고 있습니다...", "색채가 번져나갑니다...", "아르카나가 형상화됩니다..."]
            : ["Retrieving destiny...", "Colors are spreading...", "Arcana is being manifested..."];
        let idx = 0;
        setLoadingText(loadingTexts[0]);
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

    const T = {
        ko: {
            name: "당신의 이름을 어둠 속에 남겨주시겠습니까?",
            birth: " 님, 우주가 새겨놓은 숫자는?",
            loading: "운명을 인양하고 있습니다...",
            start: "나만의 인생 카드 만들기",
            inv: " 님, 이제 이 투명한 도안 위로 당신만의 빛을 입힐 차례입니다. 상징적인 '오브제' 하나를 들려주시겠어요?",
            placeholder: "당신을 증명하는 오브제를 들려주세요...",
            finish: "나만의 아르카나 완성하기",
            ad: "2026년의 운명을 인양하고 있습니다..."
        },
        en: {
            name: "Will you leave your name in the darkness?",
            birth: ", what number has the universe inscribed?",
            loading: "Retrieving destiny...",
            start: "Create My Life Card",
            inv: ", it is time to cast your own light upon this blueprint. Could you tell me one 'object' that represents you?",
            placeholder: "Tell me an object that proves your existence...",
            finish: "Complete My Arcana",
            ad: "Retrieving the destiny of 2026..."
        }
    }[lang];

    return (
        <div className="flex flex-col h-screen w-full max-w-2xl mx-auto relative overflow-hidden bg-black font-serif text-white">
            <div className="absolute top-6 right-6 z-[100]">
                <button onClick={() => setLang(l => l === "ko" ? "en" : "ko")} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] text-amber-200/80 tracking-widest uppercase">
                    <Languages className="w-3 h-3" /> {lang === "ko" ? "EN" : "KO"}
                </button>
            </div>

            <AnimatePresence mode="wait">
                {ritualStep === "complete" && (
                    <motion.div key="workshop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
                        {/* 상단: 카드 프리뷰 (화면 40% 수준으로 확대) [cite: 2026-02-16] */}
                        <div className="flex-none pt-10 pb-6 flex flex-col items-center bg-black/40 border-b border-white/5">
                            <div className="relative w-44 aspect-[2/3] shadow-[0_0_50px_rgba(251,191,36,0.25)] rounded-xl overflow-hidden border border-amber-500/20 transition-all duration-700">
                                {tarotCard && <img src={`/cards/${tarotCard.id}.jpg`} alt="Life Card" className="w-full h-full object-cover opacity-80" />}
                                <div className="absolute inset-0 mix-blend-overlay" style={{ background: collectedElements.colors.length > 0 ? `linear-gradient(45deg, ${collectedElements.colors[0]}, ${collectedElements.colors[1] || 'transparent'})` : 'transparent' }} />
                            </div>
                        </div>

                        {/* 중앙: 대화 영역 */}
                        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide space-y-6" ref={messagesEndRef}>
                            {messages.map(msg => (
                                <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                                    <div className={cn("max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed", msg.role === "user" ? "bg-white/10" : "bg-amber-900/10 border border-amber-500/10 text-amber-50")}>{msg.content}</div>
                                </div>
                            ))}
                        </div>

                        {/* 하단: 슬롯 인디케이터 및 입력부 [cite: 2026-02-16] */}
                        <div className="flex-none p-6 pb-10 bg-gradient-to-t from-black via-black to-transparent">
                            {/* 슬롯 인디케이터 (마름모 3개, 원형 2개) [cite: 2026-02-16] */}
                            <div className="flex justify-center gap-6 mb-6">
                                <div className="flex gap-2">
                                    {[0, 1, 2].map(i => (
                                        <Diamond key={i} className={cn("w-4 h-4 transition-all duration-500", i < collectedElements.objects.length ? "fill-amber-500 text-amber-500 scale-110" : "text-white/20")} />
                                    ))}
                                </div>
                                <div className="flex gap-2 border-l border-white/10 pl-6">
                                    {[0, 1].map(i => (
                                        <Circle key={i} className={cn("w-4 h-4 transition-all duration-500", i < collectedElements.colors.length ? "fill-blue-500 text-blue-500 scale-110" : "text-white/20")} />
                                    ))}
                                </div>
                            </div>

                            {collectedElements.objects.length >= 3 && collectedElements.colors.length >= 2 && (
                                <button onClick={generateStainedGlass} className="w-full mb-6 py-4 bg-amber-600/90 text-white rounded-full shadow-lg flex items-center justify-center gap-2 font-serif tracking-widest hover:bg-amber-600 transition-all active:scale-95"><Sparkles className="w-4 h-4" /> {T.finish}</button>
                            )}
                            <form onSubmit={handleSendMessage}>
                                <input value={input} onChange={e => setInput(e.target.value)} placeholder={T.placeholder} className="w-full bg-white/5 border border-white/10 rounded-full py-4 px-6 text-center focus:outline-none focus:border-amber-500/50 transition-all font-serif" />
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 초기 서사 단계 로직 유지 [cite: 2026-02-16] */}
            <AnimatePresence mode="wait">
                {ritualStep !== "complete" && (
                    <motion.div exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black p-10 text-center font-serif">
                        {ritualStep === "name" && (
                            <div key="name">
                                <h2 className="text-2xl text-amber-100 mb-8 tracking-tight">{T.name}</h2>
                                <input autoFocus value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (setRitualStep("birthdate"), setInput(""))} className="bg-transparent border-b border-amber-500/50 text-3xl text-center focus:outline-none w-64 font-serif tracking-widest" />
                            </div>
                        )}
                        {ritualStep === "birthdate" && (
                            <div key="birth">
                                <h2 className="text-2xl text-amber-100 mb-8 tracking-tight">{USER_NAME}{T.birth}</h2>
                                <input autoFocus maxLength={8} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && /^\d{8}$/.test(input)) { const card = calculateLifePathNumber(input); setTarotCard(card); setShowResultCard(true); setInput(""); } }} className="bg-transparent border-b border-amber-500/50 text-3xl text-center focus:outline-none w-64 font-serif tracking-widest" placeholder="YYYYMMDD" />
                            </div>
                        )}
                        {ritualStep === "narrative" && (
                            <div key="narrative" className="max-w-md min-h-[200px] flex flex-col items-center justify-center">
                                {!narrativeContent ? (
                                    <p className="text-amber-100 animate-pulse text-lg tracking-widest">{T.loading}</p>
                                ) : (
                                    <div className="w-full">
                                        <p className="text-amber-100 leading-relaxed text-lg whitespace-pre-wrap">{displayedText}</p>
                                        {isComplete && (
                                            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => { setRitualStep("complete"); addMessage("ai", `${USER_NAME}${T.inv}`); }} className="mt-12 px-10 py-3.5 border border-amber-500/40 text-amber-200 rounded-full hover:bg-amber-900/20 transition-all font-serif text-sm tracking-widest">{T.start} <ChevronRight className="inline w-4 h-4 ml-1" /></motion.button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {showResultCard && tarotCard && <ResultCard card={tarotCard} userName={USER_NAME} onDismiss={() => { setShowResultCard(false); setRitualStep("narrative"); startInterpretation(tarotCard); }} />}

            {showResultModal && generatedImage && (
                <ResultModal imageSrc={generatedImage} userName={USER_NAME} onClose={() => setShowResultModal(false)} onShowAd={handleShow2026Ad} />
            )}

            <AnimatePresence>
                {show2026Ad && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-10 text-center font-serif">
                        <h3 className="text-xl text-purple-200 mb-6 animate-pulse">{T.ad}</h3>
                        <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
                            <motion.div className="h-full bg-purple-500" initial={{ width: 0 }} animate={{ width: `${adProgress}%` }} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {showFinalFate && tarotCard && (
                <ResultCard card={tarotCard} userName={USER_NAME} onDismiss={() => setShowFinalFate(false)} isFinal={true} />
            )}

            {isGenerating && <div className="absolute inset-0 z-[150] bg-black/80 flex flex-col items-center justify-center"><p className="text-amber-100 animate-pulse font-serif">{loadingText}</p></div>}
        </div>
    );
}