import { useState, useEffect } from 'react';

export function useTypewriter(text: string | null, speed: number = 50) {
    const [displayedText, setDisplayedText] = useState("");
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        setDisplayedText("");
        setIsComplete(false);

        if (!text) return;

        let currentIndex = 0;
        const intervalId = setInterval(() => {
            if (currentIndex < text.length) {
                setDisplayedText((prev) => prev + text.charAt(currentIndex));
                currentIndex++;
            } else {
                clearInterval(intervalId);
                setIsComplete(true);
            }
        }, speed);

        return () => clearInterval(intervalId);
    }, [text, speed]);

    return { displayedText, isComplete };
}
