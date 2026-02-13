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
import ResultModal from "./ResultModal";
import ParticleEffect from "./ParticleEffect";
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
    const [collectedElements, setCollectedElements] = useState<{ objects: string[], colors: string[] }>({ objects: [], colors: [] }); // Phase 4.6 State

    // Audio Hook
    const { isMuted, toggleMute, playReveal, playAmbient } = useSound();

    // Narrative & Typewriter
    const [narrativeContent, setNarrativeContent] = useState<string | null>(null);
    const { displayedText, isComplete } = useTypewriter(narrativeContent, 50);
    const [ritualStep, setRitualStep] = useState<"intro" | "name" | "birthdate" | "climax" | "narrative" | "complete">("name");
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Image Gens & Ads
    // Image Gens & Ads & Modal
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showAd, setShowAd] = useState(false); // For image unlock (legacy)
    const [isHighResUnlocked, setIsHighResUnlocked] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [fillingStep, setFillingStep] = useState(0);
    const [showResultModal, setShowResultModal] = useState(false); // Phase 6.1
    const [loadingText, setLoadingText] = useState("빛의 농도를 조율 중입니다..."); // Phase 6.0

    // 2026 Vision Flow
    const [show2026Ad, setShow2026Ad] = useState(false);
    const [adProgress, setAdProgress] = useState(0);
    const [result2026Card, setResult2026Card] = useState<ArcanaCard | null>(null);

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

    // Removal Logic - Phase 5.6
    // Zero-latency Removal for BOTH Objects and Colors
    const handleRemoveItem = (type: 'object' | 'color', value: string) => {
        // Succinct feedback (optional, or just silent update)
        // For zero-latency, we prioritize state update.

        setCollectedElements(prev => {
            if (type === 'object') {
                return { ...prev, objects: prev.objects.filter(item => item !== value) };
            } else {
                return { ...prev, colors: prev.colors.filter(item => item !== value) };
            }
        });

        // Optional: Trigger a "shatter" sound here
        // playShatter();
    };

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
                        userName: userName, // Ensure persistent identity
                        collectedElements: collectedElements, // Pass current state
                        mode: "workshop" // Explicit Mode Switch
                    }),
                });

                const data = await response.json();

                if (data.role === 'ai') {
                    const content = data.content;
                    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);

                    if (jsonMatch) {
                        try {
                            const parsedData = JSON.parse(jsonMatch[1]);
                            const cleanContent = content.replace(/```json\n([\s\S]*?)\n```/, "").trim(); // Fix cleanContent regex to be robust

                            // Clean up any remaining backticks or newlines at the end
                            const displayContent = cleanContent.replace(/```$/, '').trim();

                            addMessage("ai", displayContent);

                            // Phase 4.6: Progressive State Update
                            if (parsedData.current_objects || parsedData.current_colors) {
                                setCollectedElements({
                                    objects: parsedData.current_objects || [],
                                    colors: parsedData.current_colors || []
                                });
                            }

                            // Interactive Filling Feedback based on count
                            const totalItems = (parsedData.current_objects?.length || 0) + (parsedData.current_colors?.length || 0);
                            setFillingStep(Math.min(totalItems, 5));

                            // Phase 6.3: Visual Feedback Enforcement
                            // If 5 items, immediately trigger visual climax locally even before generation
                            // The visual card component matches 'collectedElements' length.

                            // Trigger Generation ONLY if explicitly complete and meets 5 items rule
                            // Phase 6.3: We now show a BUTTON instead of auto-generating immediately, or auto-trigger after delay.
                            // User request: "Replace Input with [Create Arcana] button"
                            // But also "Auto-trigger in 5s if no action".

                            if (parsedData.is_complete && totalItems >= 5) {
                                // Just ensure state is ready. The UI will react to 'collectedElements' length.
                                // We might want to set a 'readyToGenerate' flag if differentiation is needed.
                            }
                        } catch (e) {
                            console.error("JSON Parse Error", e);
                            // Fallback: just show content if JSON fails
                            addMessage("ai", content.replace(/```json\n([\s\S]*?)\n```/, "").trim());
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

    // Phase 6.3: Auto-trigger Fail-safe
    useEffect(() => {
        let timer: NodeJS.Timeout;
        const totalItems = collectedElements.objects.length + collectedElements.colors.length;

        if (totalItems >= 5 && !isGenerating && !generatedImage && !showResultModal) {
            timer = setTimeout(() => {
                // Auto-trigger if user hasn't clicked after 5s
                console.log("Auto-triggering generation...");
                const generationData = {
                    objects: collectedElements.objects,
                    colors: collectedElements.colors,
                    mood: "Mystical and Grand"
                };
                generateStainedGlass(generationData);
            }, 5000);
        }
        return () => clearTimeout(timer);
    }, [collectedElements, isGenerating, generatedImage, showResultModal]);

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
                    userName: userName,
                    mode: "reveal" // Explicit Mode Switch
                }),
            });

            const data = await response.json();

            if (!response.ok || data.error) throw new Error(data.error);

            if (data.role === 'ai') {
                const content = data.content;
                // Strip JSON if present to prevent it from showing in the Narrative UI
                const cleanContent = content.replace(/```json\n[\s\S]*?\n```/, "").trim();
                setNarrativeContent(cleanContent);
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
        // Phase 6.0: Poetic Loading Sequence
        const loadingTexts = [
            "빛의 농도를 조율 중입니다...",
            `${userName} 님의 색채가 번져나갑니다...`,
            "아르카나가 형상화됩니다..."
        ];
        let textIndex = 0;
        setLoadingText(loadingTexts[0]);

        const interval = setInterval(() => {
            textIndex = (textIndex + 1) % loadingTexts.length;
            setLoadingText(loadingTexts[textIndex]);
        }, 2000);

        try {
            // Phase 4.5: High-Density Prompt Construction
            const objectsStr = data.objects ? data.objects.join(", ") : "";
            const colorsStr = data.colors ? data.colors.join(" and ") : data.primary_color || "mystic colors";

            const prompt = `Stained glass style, ${objectsStr}, color palette of ${colorsStr}, intricate lead lines, glowing light from behind, masterpiece, 8k. Mood: ${data.mood}`;

            // Show bridge text before generation (simulated delay if needed, but we do parallel)
            // Actually user wants bridge text in chat? No, user said "Creation Bridge" helps transition.

            const response = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            });
            const result = await response.json();

            clearInterval(interval); // Stop loading text cycle

            if (result.image) {
                setGeneratedImage(result.image);
                addMessage("ai", `드디어 ${userName} 님의 빛의 파편들이 모두 모였습니다! 함께 당신만의 아르카나를 완성해 볼까요?`);
                setTimeout(() => {
                    setShowResultModal(true); // Open Phase 6.1 Modal
                }, 1500);
            }
        } catch (error) {
            console.error(error);
            clearInterval(interval);
            addMessage("ai", "이미지 생성 실패");
        } finally {
            setIsGenerating(false);
        }
    };

    // Phase 6.1: 2026 Ad Logic
    const handleShow2026Destiny = () => {
        setShowResultModal(false);
        setShow2026Ad(true);
        setAdProgress(0);

        // Simulation
        const duration = 5000; // 5s
        const startTime = Date.now();

        const adInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / duration) * 100, 100);
            setAdProgress(progress);

            if (progress >= 100) {
                clearInterval(adInterval);
                setShow2026Ad(false);
                // Calculate 2026 Card (Mock: Just calculate distinct card or random)
                // Let's use Year 2026 + Birthdate logic or just current card + 1 for variety
                const nextCardId = ((tarotCard?.id || 0) + 1) % 22;
                // Creating a mock card for 2026
                const mock2026Card: ArcanaCard = {
                    id: nextCardId,
                    name: "The Vision 2026",
                    nameKr: "2026년의 비전",
                    meaning: "새로운 시작과 운명의 흐름. 2026년, 당신에게 다가올 가장 강력한 빛의 파동입니다.",
                    keywords: ["Destiny", "New Year", "Light"],
                };
                setResult2026Card(mock2026Card);
                // Show ResultCard for 2026
                setTimeout(() => {
                    setShowResultCard(true);
                    // Override standard behavior? No, standard ResultCard takes props.
                    // But Standard ResultCard is full screen overlay.
                    // I will reuse ResultCard state but pass differnet card.
                    setTarotCard(mock2026Card); // Swap content temporarily?
                    // Better to just set TarotCard to it?
                    // Or separate state.
                    // Let's reuse showResultCard + setTarotCard logic.
                    // But 'tarotCard' is main state.
                    // It's fine to switch it for the "End".
                    setTarotCard(mock2026Card);
                }, 500);
            }
        }, 100);
    };

    // Animation Variants
    const fadeVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
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
                LAYER 1: WORKSHOP MODE (The Grand Altar)
                Vertical Stack: Card (Big) -> Indicator -> Chat -> Input
            */}
            <div className={cn(
                "absolute inset-0 flex flex-col items-center justify-between py-6 z-10 transition-all duration-1000",
                step === "chat" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}>
                {/* Scrim Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none -z-10 transition-opacity duration-1000" />

                {/* 1. THE GRAND ALTAR (Card) - 80% Width (Fixed Phase 6.0) */}
                <div className="relative w-[80%] max-w-[280px] aspect-[2/3] shrink-0 z-20">
                    {/* Phase 6.0: Visual Symmetry Entrance */}
                    {step === "chat" && !collectedElements.objects.length && (
                        <ParticleEffect type="gather" color="#fbbf24" duration={2} />
                    )}
                    {tarotCard ? (
                        <motion.div
                            layoutId="tarot-card-anchor"
                            className={cn(
                                "relative w-full h-full rounded-xl overflow-hidden border border-amber-500/50 transition-all duration-500",
                                // Grand Altar Shadow
                                "shadow-[0_0_30px_rgba(255,215,0,0.4)]",
                                // Dynamic Glow based on Object count
                                collectedElements.objects.length === 1 && "shadow-[0_0_40px_rgba(255,215,0,0.6)] border-amber-400",
                                collectedElements.objects.length === 2 && "shadow-[0_0_50px_rgba(255,215,0,0.8)] border-amber-300 ring-1 ring-amber-300",
                                collectedElements.objects.length >= 3 && "shadow-[0_0_60px_rgba(255,215,0,1)] border-white ring-2 ring-white/50"
                            )}
                        >
                            {/* Glass Texture Overlay */}
                            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none" />

                            {/* Phase 4.6 & 6.3: Color Infusion (Overlay) - Immediate Reaction */}
                            <div
                                className="absolute inset-0 z-0 transition-colors duration-1000 mix-blend-overlay"
                                style={{
                                    background: collectedElements.colors.length > 0
                                        ? `linear-gradient(to bottom right, ${collectedElements.colors[0]}, ${collectedElements.colors[1] || collectedElements.colors[0]})`
                                        : 'linear-gradient(to bottom right, #4c1d95, #000000)',
                                    opacity: collectedElements.objects.length >= 3 && collectedElements.colors.length >= 2 ? 0.9 : 0.8
                                }}
                            />
                            {/* Particles for Objects */}
                            {collectedElements.objects.map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                                    className="absolute w-4 h-4 bg-amber-200 rounded-full blur-[2px] z-10"
                                    style={{
                                        top: `${20 + (i * 25)}%`,
                                        left: `${20 + (i * 20)}%`
                                    }}
                                />
                            ))}

                            <span className="absolute inset-0 flex items-center justify-center text-sm text-amber-200 font-bold z-20 mix-blend-overlay">{tarotCard.id}</span>
                        </motion.div>
                    ) : (
                        <div className="w-full h-full bg-white/5 rounded-xl border border-white/10" />
                    )}
                </div>

                {/* 2. PROGRESS INDICATOR (5 Slots) */}
                <div className="flex items-center gap-3 py-2 z-20">
                    {/* 3 Object Slots (Circles) */}
                    {[0, 1, 2].map((i) => (
                        <div
                            key={`slot-obj-${i}`}
                            className={cn(
                                "w-3 h-3 rounded-full border border-amber-500/50 transition-all duration-500",
                                i < collectedElements.objects.length ? "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]" : "bg-transparent"
                            )}
                        />
                    ))}
                    {/* Spacer */}
                    <div className="w-4 h-[1px] bg-white/20" />
                    {/* 2 Color Slots (Squares) */}
                    {[0, 1].map((i) => (
                        <div
                            key={`slot-col-${i}`}
                            className={cn(
                                "w-3 h-3 rotate-45 border border-purple-500/50 transition-all duration-500",
                                i < collectedElements.colors.length
                                    ? `bg-[${collectedElements.colors[i] || '#a855f7'}] shadow-[0_0_10px_rgba(168,85,247,0.8)] bg-purple-400` // rudimentary fallback color visual
                                    : "bg-transparent"
                            )}
                            style={{
                                backgroundColor: i < collectedElements.colors.length ? collectedElements.colors[i] : 'transparent'
                            }}
                        />
                    ))}
                </div>

                {/* 3. CHAT LOG (Condensed) */}
                <div className="flex-1 w-full max-w-md overflow-hidden relative z-10 min-h-[100px] flex flex-col justify-end px-6">
                    <div className="overflow-y-auto space-y-3 scrollbar-hide mask-gradient-top-bottom py-2">
                        <AnimatePresence mode="popLayout">
                            {messages.slice(-3).map((msg) => ( // Only show last 3 messages for focus
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn("flex w-full", msg.role === "user" ? "justify-end" : "justify-start")}
                                >
                                    <div className={cn(
                                        "max-w-[90%] text-sm shadow-sm px-3 py-2 rounded-lg backdrop-blur-sm",
                                        msg.role === "user"
                                            ? "bg-white/10 text-purple-100 font-light text-right border border-white/5"
                                            : "bg-black/40 text-amber-50/90 font-serif border border-amber-500/20"
                                    )}>
                                        {msg.content}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* 4. INPUT AREA + SHARDS */}
                <div className="w-full max-w-md px-6 pb-4 flex flex-col gap-3 z-30">
                    {/* Shard Chips (Actionable Undo) - Objects AND Colors */}
                    <div className="flex flex-wrap gap-2 justify-center min-h-[30px]">
                        <AnimatePresence mode="popLayout">
                            {/* Objects */}
                            {collectedElements.objects.map((obj, i) => (
                                <motion.div
                                    key={`chip-obj-${i}`}
                                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                                    className="flex items-center gap-2 px-3 py-1 bg-amber-900/40 border border-amber-500/30 rounded-full cursor-pointer hover:bg-amber-800/60 transition-colors group"
                                    onClick={() => handleRemoveItem('object', obj)}
                                >
                                    <span className="text-xs text-amber-100/80 font-serif">{obj}</span>
                                    <X className="w-3 h-3 text-amber-500/50 group-hover:text-amber-300" />
                                </motion.div>
                            ))}
                            {/* Colors */}
                            {collectedElements.colors.map((col, i) => (
                                <motion.div
                                    key={`chip-col-${i}`}
                                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                                    className="flex items-center gap-2 px-3 py-1 bg-purple-900/40 border border-purple-500/30 rounded-full cursor-pointer hover:bg-purple-800/60 transition-colors group"
                                    onClick={() => handleRemoveItem('color', col)}
                                >
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col }} />
                                    <span className="text-xs text-purple-100/80 font-serif">{col}</span>
                                    <X className="w-3 h-3 text-purple-500/50 group-hover:text-purple-300" />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    <form onSubmit={handleSendMessage} className="w-full relative">
                        {/* Phase 6.3: Hide Input when complete */}
                        {!(collectedElements.objects.length >= 3 && collectedElements.colors.length >= 2) && (
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={
                                    collectedElements.objects.length < 3
                                        ? "이곳에 남길 상징을 이야기해주세요..."
                                        : "이 풍경을 물들일 색을 이야기해주세요..."
                                }
                                className="w-full bg-black/20 border-b border-amber-500/30 py-3 text-center text-lg text-amber-100 placeholder:text-white/10 focus:outline-none focus:border-amber-400 transition-colors font-serif"
                            />
                        )}
                    </form>
                </div>

                {/* 5. STICKY CREATE BUTTON (Phase 6.3) */}
                <AnimatePresence>
                    {collectedElements.objects.length >= 3 && collectedElements.colors.length >= 2 && !isGenerating && !generatedImage && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="absolute bottom-6 z-50 w-full px-6 flex justify-center pointer-events-auto"
                        >
                            <button
                                onClick={() => {
                                    const generationData = {
                                        objects: collectedElements.objects,
                                        colors: collectedElements.colors,
                                        mood: "Mystical and Grand" // Default mood or derived
                                    };
                                    generateStainedGlass(generationData);
                                }}
                                className="relative group w-full max-w-sm py-4 rounded-xl bg-gradient-to-r from-amber-900/90 to-black border border-amber-500/50 shadow-[0_0_30px_rgba(251,191,36,0.5)] overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />
                                <span className="relative z-10 font-serif text-amber-100 text-lg tracking-[0.2em] flex items-center justify-center gap-3">
                                    <Sparkles className="w-5 h-5 text-amber-400 animate-spin-slow" />
                                    나만의 아르카나 생성하기
                                    <Sparkles className="w-5 h-5 text-amber-400 animate-spin-slow" />
                                </span>
                                {/* Shimmer Effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
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
                                    className="relative w-full h-full flex flex-col items-center"
                                >
                                    {/* 1. Stacked Header (Title + Divider) - Safe Zone Enforced */}
                                    <div className="w-full pt-12 text-center z-20 shrink-0 mb-20 relative">
                                        <motion.div
                                            initial={{ opacity: 0, y: -20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.5, duration: 1 }}
                                            className="flex flex-col items-center gap-2"
                                        >
                                            <motion.span
                                                animate={{ opacity: [0.5, 1, 0.5] }}
                                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                                className="text-amber-500 text-xs tracking-[0.3em] uppercase"
                                            >
                                                Arcana No.{tarotCard?.id}
                                            </motion.span>
                                            <h1 className="text-3xl md:text-4xl font-serif text-amber-100/90 tracking-[0.2em] font-light">
                                                {tarotCard?.name} <span className="text-lg opacity-50 ml-2 font-normal">{tarotCard?.nameKr}</span>
                                            </h1>
                                            {/* Golden Divider */}
                                            <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mt-4" />
                                        </motion.div>
                                    </div>

                                    {/* 2. Body Text Area - Vertical Flow Enforced */}
                                    <div className="flex-1 w-full overflow-hidden relative z-10">
                                        {/* Scrollable Container with Mask */}
                                        <div className="w-full h-full overflow-y-auto px-10 scrollbar-hide mask-gradient-bottom pb-12">
                                            <div className="relative w-full max-w-xl mx-auto flex flex-col items-center">
                                                <p className="text-sm font-serif text-amber-100 leading-[1.8] text-center drop-shadow-lg whitespace-pre-wrap">
                                                    {displayedText}
                                                    {!isComplete && <span className="animate-pulse ml-1 text-amber-500">|</span>}
                                                </p>

                                                {/* Enter Workshop Button - Flows naturally below text */}
                                                <AnimatePresence>
                                                    {isComplete && (
                                                        <motion.button
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: 10 }}
                                                            transition={{ delay: 0.5, duration: 1 }}
                                                            onClick={handleEnterWorkshop}
                                                            className="mt-12 group flex items-center gap-3 px-8 py-3 rounded-full border border-amber-500/30 bg-black/40 hover:bg-amber-900/40 backdrop-blur-sm transition-all duration-300 hover:border-amber-400/60 z-30 shadow-lg shrink-0"
                                                        >
                                                            <span className="text-amber-200/80 font-serif tracking-widest text-sm group-hover:text-amber-100 transition-colors">
                                                                나만의 조각 채우기
                                                            </span>
                                                            <span className="text-amber-400 group-hover:translate-x-1 transition-transform duration-300">→</span>
                                                        </motion.button>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
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

            {/* Phase 6.1: Result Modal */}
            {showResultModal && generatedImage && (
                <ResultModal
                    imageSrc={generatedImage}
                    userName={userName}
                    onClose={() => setShowResultModal(false)}
                    onShowAd={handleShow2026Destiny}
                />
            )}

            {/* Phase 6.1: 2026 Ad Simulation Overlay */}
            <AnimatePresence>
                {show2026Ad && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-8 text-center"
                    >
                        <h2 className="text-xl font-serif text-purple-200 mb-6 animate-pulse">
                            운명의 주파수를 맞추는 중...
                        </h2>
                        <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-purple-500 shadow-[0_0_10px_#a855f7]"
                                initial={{ width: 0 }}
                                animate={{ width: `${adProgress}%` }}
                            />
                        </div>
                        <p className="mt-4 text-xs text-white/30 font-serif tracking-widest">
                            더 깊은 운명을 인양하기 위한 준비의 시간...
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Poetic Loading Overlay */}
            <AnimatePresence>
                {isGenerating && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center"
                    >
                        {/* Phase 6.0: Visual Symmetry Swirl */}
                        <div className="absolute inset-0 pointer-events-none">
                            <ParticleEffect type="swirl" color="#fbbf24" duration={2} />
                        </div>

                        <div className="text-center z-10">
                            <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-4 animate-spin-slow" />
                            <p className="text-amber-100 font-serif text-lg tracking-widest animate-pulse">
                                {loadingText}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
