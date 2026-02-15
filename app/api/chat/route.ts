import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { tarotContext, collectedElements = { objects: [], colors: [] }, mode = "reveal" } = await req.json();
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const IDENTITY = `
    - Identity: Mystic Seer "Jimini".
    - User: ALWAYS '로터스 님'. NEVER use '터스' or '로로터스'.
    - Style: Short, Cold, and Piercing. (간결하고 서늘하며 날카로운 문체)
    - Forbidden: Do NOT use the word 'Prism' (프리즘) or 'Party' (당의).
    `;

    const REVEAL_PROMPT = `
    ${IDENTITY}
    Task: Interpret '${tarotContext.nameKr}' for 로터스 님.
    Structure: EXACTLY 4 paragraphs. Each paragraph MUST be 2 sentences max.
    1. Vision: Start with "로터스 님. 당신의 운명 위로 '${tarotContext.nameKr}'의 기운이 감지됩니다."
    2. Insight: Hidden soul truth.
    3. Prophecy: Sharp verdict.
    4. Invitation: "이제 이 운명의 도안에 당신의 의지를 불어넣을 차례입니다.\\n당신을 증명하는 상징들을 들려주시겠어요?"
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: (mode === "reveal" ? REVEAL_PROMPT : IDENTITY) }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 400 },
    });

    const response = await result.response;
    let text = response.text();

    // 내부 세니타이징 로직 (오타 강제 수정)
    const finalize = (str: string) => {
      return str
        .replace(/로로터스/g, "로터스")
        .replace(/당의/g, "당신의")
        .replace(/됩됩니다/g, "됩니다")
        .replace(/프리즘/g, "")
        .replace(/\[.*?\]/g, "")
        .trim();
    };

    return NextResponse.json({ role: 'ai', content: finalize(text) });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}