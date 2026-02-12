"use client";

import { useState, useEffect, useRef } from "react";

export function useSound() {
    const [isMuted, setIsMuted] = useState(true); // Default Muted

    // Refs for audio objects
    const revealRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Initialize Audio objects
        // TODO: User needs to provide actual sound files in /public/sounds/

        revealRef.current = new Audio("/sounds/low-bell.mp3");
        revealRef.current.volume = 0.4; // Reduced volume for subtle "tick" feel due to lack of ambient

        return () => {
            revealRef.current?.pause();
        };
    }, []);

    useEffect(() => {
        if (revealRef.current) {
            revealRef.current.muted = isMuted;
        }
    }, [isMuted]);

    const toggleMute = () => {
        setIsMuted(prev => !prev);
    };

    const playReveal = () => {
        if (revealRef.current && !isMuted) {
            revealRef.current.currentTime = 0;
            // Short, dry tick sound simulation (or just play existing clip very briefly)
            revealRef.current.play().catch(e => console.log("Audio play error:", e));
        }
    };

    // Ambient removed as per Phase 2.98
    const playAmbient = () => { };

    return { isMuted, toggleMute, playReveal, playAmbient };
}
