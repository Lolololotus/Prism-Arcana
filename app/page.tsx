import ChatWindow from "@/components/ChatWindow";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-gray-900 via-purple-900 to-black text-white">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        {/* Header/Logo placeholder if needed */}
      </div>

      <div className="relative z-10 w-full flex flex-col items-center gap-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 tracking-tighter">
            Prism Arcana
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto">
            사유를 빛의 예술로 형상화하다
          </p>
        </div>

        <ChatWindow />
      </div>
    </main>
  );
}
