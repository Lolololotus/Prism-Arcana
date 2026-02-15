import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { tarotContext, mode = "reveal", lang = "ko" } = await req.json();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const IDENTITY = `
    - Identity: Mystic Seer "Jimini".
    - Name Guard: ALWAYS '로터스 님' or 'Lotus'. NEVER say '로스', '터스'. (CRITICAL)
    - Formatting: EXACTLY 4 paragraphs. NO line breaks WITHIN paragraphs.
    - Language: ONLY ${lang === "ko" ? "Korean" : "English"}.
    `;

    const REVEAL_PROMPT = `${IDENTITY}
    Interpret '${lang === "ko" ? tarotContext.nameKr : tarotContext.nameEn}' for ${lang === "ko" ? "로터스 님" : "Lotus"}.
    - DO NOT mention '오브제' or 'Object' yet. (서사 단계 격리) [cite: 2026-02-16]
    - Style: Divine, Cold, High-Density.
    - Each paragraph 2-3 sentences.
    `;

    const WORKSHOP_PROMPT = `${IDENTITY}
    - Role: Stained Glass Architect.
    Guide the user to provide 3 Objects and 2 Colors. Use '${lang === "ko" ? "오브제" : "Object"}'.
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: (mode === "reveal" ? REVEAL_PROMPT : WORKSHOP_PROMPT) }] }],
      generationConfig: { temperature: 0.65, maxOutputTokens: 600 },
    });

    const finalize = (str: string) => {
      let cleaned = str
        .replace(/로스 님/g, "로터스 님") // 이름 수복
        .replace(/터스 님/g, "로터스 님") // 호칭 수복
        .replace(/로로터스/g, "로터스")
        .replace(/당의/g, "당신의")
        .replace(/([^\n])\n([^\n])/g, "$1 $2") // 단락 내 줄바꿈 물리적 차단
        .trim();

      // 언어 가드: 선택되지 않은 언어의 텍스트가 섞이는 것을 물리적으로 차단
      return lang === "ko" ? cleaned.replace(/[a-zA-Z]{10,}/g, "") : cleaned.replace(/[가-힣]{2,}/g, "");
    };

    return NextResponse.json({ role: 'ai', content: finalize(result.response.text()) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}