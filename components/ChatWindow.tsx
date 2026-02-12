import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, Sparkles, X, Play, ShieldCheck, Lock, Unlock, CreditCard, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateLifePathNumber, ArcanaCard } from "@/lib/tarot";
import { useSound } from "@/hooks/useSound";
import { useTypewriter } from "@/hooks/useTypewriter";
import RewardAdModal from "./RewardAdModal";
import OrderComingSoon from "./OrderComingSoon";
import ResultCard from "./ResultCard";
import { initializePayment, requestPayment } from "@/lib/payment";

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
    initialMessage = "당신의 이름을 이 어둠 속에 나지막이 남겨주시겠습니까?",
}: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState<"name" | "birthdate" | "chat">("name");
    const [userName, setUserName] = useState("");
    const [tarotCard, setTarotCard] = useState<ArcanaCard | null>(null);
    const [showResultCard, setShowResultCard] = useState(false);
    const [moodColor, setMoodColor] = useState("from-gray-900 via-purple-900 to-black");

    // Audio Hook
    const { isMuted, toggleMute, playReveal, playAmbient } = useSound();

    // Narrative & Typewriter
    const [narrativeContent, setNarrativeContent] = useState<string | null>(null);
    const { displayedText, isComplete } = useTypewriter(narrativeContent, 50);
    const [ritualStep, setRitualStep] = useState<"intro" | "name" | "birthdate" | "climax" | "narrative" | "complete">("name");
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Image Gens & Ads
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showAd, setShowAd] = useState(false);
    const [isHighResUnlocked, setIsHighResUnlocked] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [fillingStep, setFillingStep] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Initial greeting delayed
        const timer = setTimeout(() => {
            addMessage("ai", initialMessage);
        }, 500);
        return () => clearTimeout(timer);
    }, [initialMessage]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Transition Logic - Manual Trigger via Button
    const handleEnterWorkshop = () => {
        if (!isTransitioning) {
            setIsTransitioning(true);
            // Wait for cross-fade then switch step effectively
            setTimeout(() => {
                setStep("chat");
                setRitualStep("complete");
                setMessages([]); // Clear history for a fresh start

                // Trigger Jimini's First Inquiry
                setTimeout(() => {
                    const firstInquiry = `${userName} 님, 이제 이 투명한 도안 위로 당신만의 특별한 빛을 입혀보려 합니다. 이 도안의 어느 부분을 당신의 소중한 존재로 채워볼까요? 곁에 있는 작은 생명체나, 당신에게 깊은 영감을 주는 상징적인 사물도 좋습니다.`;
                    addMessage("ai", firstInquiry);
                }, 500);

                // Focus input
                setTimeout(() => inputRef.current?.focus(), 100);
            }, 2000); // 2s duration for drama
        }
    };

    // Auto-scroll effect hook removed as we want manual transition now.

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
        updateMood(userInput);
        addMessage("user", userInput);

        if (step === "name" || step === "birthdate") {
            setIsLoading(true);
            setTimeout(() => {
                setIsLoading(false);
                processInput(userInput);
            }, 1000);
        } else {
            // Chat phase
            setIsLoading(true);
            try {
                // Construct payload manually to include the new user message immediately
                // (State update 'setMessages' is async and won't be reflected in 'messages' yet)
                const currentHistory = messages.map(msg => ({
                    role: msg.role,
                    content: typeof msg.content === 'string' ? msg.content : '...'
                }));
                const payloadMessages = [...currentHistory, { role: "user", content: userInput }];

                const response = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        messages: payloadMessages,
                        tarotContext: tarotCard,
                        userName: userName // Ensure persistent identity
                    }),
                });

                const data = await response.json();

                if (data.role === 'ai') {
                    const content = data.content;
                    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);

                    if (jsonMatch) {
                        const retrievalData = JSON.parse(jsonMatch[1]);
                        const cleanContent = content.replace(/```json\n[\s\S]*?\n```/, "").trim();
                        addMessage("ai", cleanContent);

                        if (cleanContent.includes("스며듭니다") || cleanContent.includes("채워")) {
                            setFillingStep(prev => Math.min(prev + 1, 3));
                        }

                        if (retrievalData.objects && (retrievalData.colors || retrievalData.primary_color)) {
                            generateStainedGlass(retrievalData);
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

    // ... (rest of functions unchanged)

    const processInput = (text: string) => {
        if (step === "name") {
            setUserName(text);
            addMessage("ai", `${text} 님, 당신이 태어난 밤, 우주가 새겨놓은 특별한 숫자를 알려주세요. (YYYYMMDD)`);
            setStep("birthdate");
        } else if (step === "birthdate") {
            // Logic handled in handleRitualSubmit mostly
        }
    };

    const triggerInitialGreeting = async (card: ArcanaCard) => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [],
                    tarotContext: card,
                    userName: userName
                }),
            });

            const data = await response.json();

            if (!response.ok || data.error) throw new Error(data.error);

            if (data.role === 'ai') {
                setNarrativeContent(data.content);
                // Narrative Mode Set
            }
        } catch (error) {
            console.error(error);
            addMessage("ai", `Error: ${error instanceof Error ? error.message : "Unknown"}`);
        } finally {
            setIsLoading(false);
        }
    };

    const updateMood = (text: string) => {
        if (text.includes("사랑") || text.includes("행복")) setMoodColor("from-pink-900 via-red-900 to-black");
        else if (text.includes("슬픔")) setMoodColor("from-blue-900 via-gray-900 to-black");
        else if (text.includes("꿈")) setMoodColor("from-indigo-900 via-purple-900 to-black");
        else setMoodColor("from-gray-900 via-purple-900 to-black");
    };

    const generateStainedGlass = async (data: any) => {
        setIsGenerating(true);
        try {
            // Phase 4.5: High-Density Prompt Construction
            const objectsStr = data.objects ? data.objects.join(", ") : "";
            const colorsStr = data.colors ? data.colors.join(" and ") : data.primary_color || "mystic colors";

            const prompt = `Stained glass style, ${objectsStr}, color palette of ${colorsStr}, intricate lead lines, glowing light from behind, masterpiece, 8k. Mood: ${data.mood}`;

            const response = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            });
            const result = await response.json();
            if (result.image) {
                setGeneratedImage(result.image);
                addMessage("ai", "당신의 사유가 빛으로 형상화되었습니다.");
            }
        } catch (error) {
            console.error(error);
            addMessage("ai", "이미지 생성 실패");
        } finally {
            setIsGenerating(false);
        }
    };

    // Animation Variants
    const fadeVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeInOut" } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.5 } }
    };

    const handleRitualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        if (step === "name") {
            setUserName(input);
            setInput("");
            setStep("birthdate");
        } else if (step === "birthdate") {
            if (!/^\d{8}$/.test(input.replace(/\s/g, ""))) return;
            setRitualStep("climax");

            try {
                const card = calculateLifePathNumber(input);
                setTarotCard(card);
                setTimeout(() => {
                    playReveal();
                    setShowResultCard(true);
                    setInput("");
                }, 4000);
            } catch (error) {
                console.error(error);
            }
        }
    };

    return (
        <div className={cn(
            "flex flex-col h-[80vh] w-full max-w-2xl mx-auto rounded-2xl overflow-hidden relative transition-all duration-1000",
            step === "chat" ? "glass-panel shadow-2xl bg-black/40 backdrop-blur-md border border-white/10" : "bg-transparent shadow-none border-none"
        )}>
            {/* 
                LAYER 1: WORKSHOP MODE (Chat Interface)
                Strict Layout: Top(15%) - Center(65%) - Bottom(20%)
            */}
            <div className={cn(
                "absolute inset-0 flex flex-col z-10 transition-all duration-1000",
                step === "chat" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}>
                {/* Scrim Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none -z-10 transition-opacity duration-1000" />

                {/* Top: Visual Anchor (approx 15%) */}
                <div className="h-[15%] min-h-[80px] px-6 border-b border-white/5 flex items-center justify-between glass-glow z-20 bg-black/20">
                    <div className="flex items-center gap-4">
                        {/* Visual Anchor: Card Icon */}
                        {tarotCard ? (
                            <motion.div
                                layoutId="tarot-card-anchor"
                                className={cn(
                                    "relative w-10 h-14 rounded overflow-hidden border border-amber-500/50 shadow-[0_0_15px_rgba(251,191,36,0.3)] bg-gradient-to-br from-purple-900 to-black transition-all duration-300",
                                    input.length > 0 && "shadow-[0_0_20px_rgba(251,191,36,0.6)] border-amber-400" // Typing feedback
                                )}
                            >
                                <span className="absolute inset-0 flex items-center justify-center text-[10px] text-amber-200 font-bold">{tarotCard.id}</span>
                            </motion.div>
                        ) : (
                            // Placeholder anchor
                            <div className="w-10 h-14 bg-white/5 rounded" />
                        )}
                        <div className="flex flex-col">
                            <span className="text-[10px] text-amber-500 tracking-widest uppercase">WORKSHOP MODE</span>
                            <span className="font-serif text-lg text-amber-100 tracking-wider">
                                {tarotCard ? `${tarotCard.id}. ${tarotCard.name} ${tarotCard.nameKr}` : "Jimini"}
                            </span>
                        </div>
                    </div>
                    {/* Controls */}
                    <div className="flex items-center gap-3">
                        <div className="text-xs text-purple-300 font-serif opacity-50">Prism Arcana v0.25</div>
                        <button onClick={toggleMute} className="p-2 rounded-full hover:bg-white/10 text-purple-300/50 transition-colors">
                            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Center: Narrative Chat (approx 65%) */}
                <div className="h-[65%] flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-purple-900/50 z-10">
                    <AnimatePresence>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn("flex w-full", msg.role === "user" ? "justify-end" : "justify-start")}
                            >
                                <div className={cn(
                                    "max-w-[85%] text-sm leading-loose shadow-sm",
                                    msg.role === "user"
                                        ? "text-purple-100 font-light text-right"
                                        : "text-amber-50/90 font-serif"
                                )}>
                                    {msg.role === "ai" && <span className="block text-[10px] text-amber-500/50 mb-1 tracking-widest">JIMINI</span>}
                                    {msg.content}
                                </div>
                            </motion.div>
                        ))}
                        {isLoading && (
                            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start w-full">
                                <div className="flex gap-2 items-center">
                                    <Sparkles className="w-3 h-3 text-amber-500/50 animate-pulse" />
                                    <span className="text-xs text-amber-500/50 font-serif tracking-widest">조각을 빚는 중...</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>

                {/* Bottom: Input Area (approx 20%) */}
                {step === "chat" && (
                    <div className="h-[20%] min-h-[100px] p-6 flex flex-col justify-center bg-gradient-to-t from-black via-black/90 to-transparent z-20">
                        <form onSubmit={handleSendMessage} className="w-full relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="예: 초록 눈을 가진 검은 고양이"
                                className="w-full bg-transparent border-b border-amber-500/30 py-3 text-lg text-amber-100 placeholder:text-white/20 focus:outline-none focus:border-amber-400 transition-colors font-serif"
                            />
                            {/* Animated Cursor Hint (optional, css based or icon) */}
                            <div className="absolute right-0 bottom-3 text-amber-500/50 animate-pulse pointer-events-none">
                                <span className="text-xs tracking-widest">ENTER</span>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* 
                LAYER 2: CINEMATIC MODE (Ritual Overlay)
                High Z-index to cover everything.
                Strictly separated from Workshop Mode.
            */}
            <AnimatePresence>
                {step !== "chat" && (
                    <motion.div
                        key="ritual-overlay"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 1.5, ease: "easeInOut" } }}
                        className="absolute inset-0 z-50 bg-transparent flex flex-col items-center justify-center p-8 text-center"
                    >
                        <AnimatePresence mode="wait">
                            {/* Intro / Name Step */}
                            {step === "name" && (
                                <motion.div key="name" variants={fadeVariants} initial="hidden" animate="visible" exit="exit" className="w-full max-w-md">
                                    <h2 className="text-2xl font-serif text-amber-100 drop-shadow-glow mb-8 leading-relaxed">
                                        당신의 소중한 이름을<br />이 어둠 속에 남겨주시겠습니까?
                                    </h2>
                                    <form onSubmit={handleRitualSubmit}>
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            className="w-full bg-transparent border-b border-amber-500/50 text-center text-3xl text-white font-serif py-2 focus:outline-none focus:border-amber-400"
                                            placeholder="Name"
                                            autoFocus
                                        />
                                    </form>
                                </motion.div>
                            )}

                            {/* Birthdate Step - STRICT CONDITION */}
                            {step === "birthdate" && !["climax", "narrative", "complete"].includes(ritualStep) && (
                                <motion.div key="birthdate" variants={fadeVariants} initial="hidden" animate="visible" exit="exit" className="w-full max-w-md">
                                    <h2 className="text-2xl font-serif text-amber-100 drop-shadow-glow mb-8 leading-relaxed">
                                        <span className="text-amber-400">{userName}</span> 님, 태어난 밤<br />우주가 새겨놓은 숫자는?
                                    </h2>
                                    <form onSubmit={handleRitualSubmit}>
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            className="w-full bg-transparent border-b border-amber-500/50 text-center text-3xl text-white font-serif py-2 focus:outline-none focus:border-amber-400 tracking-widest"
                                            placeholder="YYYYMMDD"
                                            maxLength={8}
                                            autoFocus
                                        />
                                    </form>
                                </motion.div>
                            )}


                            {/* Narrative Mode with Scrim & LayoutId */}
                            {ritualStep === "narrative" && (
                                <motion.div
                                    key="narrative-ui"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="relative w-full h-full flex flex-col"
                                >
                                    {/* Top: Fixed Header (Card Name) - Minimal & Elegant */}
                                    <div className="absolute top-0 left-0 w-full pt-12 text-center z-20">
                                        <motion.div
                                            initial={{ opacity: 0, y: -20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.5, duration: 1 }}
                                            className="flex flex-col items-center gap-2"
                                        >
                                            <span className="text-amber-500 text-xs tracking-[0.3em] uppercase opacity-70">Arcana No.{tarotCard?.id}</span>
                                            <h1 className="text-3xl md:text-4xl font-serif text-amber-100/90 tracking-[0.2em] font-light">
                                                {tarotCard?.name} <span className="text-lg opacity-50 ml-2 font-normal">{tarotCard?.nameKr}</span>
                                            </h1>
                                            <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mt-4" />
                                        </motion.div>
                                    </div>

                                    {/* Center/Bottom: Narrative Text (Scrim) */}
                                    <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-8 pt-24 text-center">

                                        <div className="min-h-[200px] flex items-center justify-center">
                                            <p className="max-w-xl text-base md:text-lg font-serif text-amber-100 leading-[1.8] text-center drop-shadow-lg whitespace-pre-wrap">
                                                {displayedText}
                                                {!isComplete && <span className="animate-pulse ml-1 text-amber-500">|</span>}
                                            </p>
                                        </div>

                                        {/* Enter Workshop Button - Appears after text completion */}
                                        <AnimatePresence>
                                            {isComplete && (
                                                <motion.button
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    transition={{ delay: 0.5, duration: 1 }}
                                                    onClick={handleEnterWorkshop}
                                                    className="mt-12 group flex items-center gap-3 px-8 py-3 rounded-full border border-amber-500/30 bg-black/20 hover:bg-amber-900/20 backdrop-blur-sm transition-all duration-300 hover:border-amber-400/60"
                                                >
                                                    <span className="text-amber-200/80 font-serif tracking-widest text-sm group-hover:text-amber-100 transition-colors">
                                                        나만의 조각 채우기
                                                    </span>
                                                    <span className="text-amber-400 group-hover:translate-x-1 transition-transform duration-300">→</span>
                                                </motion.button>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Scrim Gradient BEHIND text */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none -z-10" />

                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Result Card (Climax) */}
            {showResultCard && tarotCard && (
                <ResultCard
                    card={tarotCard}
                    userName={userName}
                    onReveal={playReveal}
                    onDismiss={() => {
                        setShowResultCard(false);
                        setTimeout(() => triggerInitialGreeting(tarotCard), 500);
                        setRitualStep("narrative");
                    }}
                />
            )}
            <RewardAdModal
                isOpen={showAd}
                onClose={() => setShowAd(false)}
                onReward={() => {
                    setIsHighResUnlocked(true);
                    setShowAd(false);
                    addMessage("ai", "고해상도 이미지가 해금되었습니다.");
                }}
            />
            <OrderComingSoon isOpen={showOrderModal} onClose={() => setShowOrderModal(false)} />
        </div>
    );
}
