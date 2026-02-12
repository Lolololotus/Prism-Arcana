"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ChatWindow from "@/components/ChatWindow";
import TitleScreen from "@/components/TitleScreen";
import StarryBackground from "@/components/StarryBackground";

export default function Home() {
  const [showTitleScreen, setShowTitleScreen] = useState(true);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 text-white overflow-hidden relative">
      <StarryBackground />
      <AnimatePresence mode="wait">
        {showTitleScreen ? (
          <motion.div
            key="title"
            className="fixed inset-0 z-50"
            exit={{ opacity: 0, filter: "blur(10px)", transition: { duration: 1 } }}
          >
            <TitleScreen onStart={() => setShowTitleScreen(false)} />
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            className="w-full h-full flex flex-col items-center justify-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <div className="relative z-10 w-full flex flex-col items-center gap-8">
              <ChatWindow />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
