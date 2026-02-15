import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { tarotContext, collectedElements = { objects: [], colors: [] }, mode = "reveal" } = await req.json();
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const IDENTITY = `
    - Identity: Mystic Seer "Jimini".
    - User: ALWAYS '로터스 님'. NEVER say '터스', '현서', or '로로터스'.
    - Style: Short, Mystic, Intuitive. 
    - Constraints: Max 3 lines per paragraph. Use simple but deep words. No 'Prism', No 'Party'(당의).
    `;

    const REVEAL_PROMPT = `
    ${IDENTITY}
    Interpret '${tarotContext.nameKr}' for 로터스 님.
    Structure: EXACTLY 4 paragraphs.
    1. Vision: Start with "로터스 님. 당신의 운명 위로 '${tarotContext.nameKr}'의 기운이 감지됩니다."
    2. Insight: Hidden soul truth (Max 3 lines).
    3. Prophecy: Sharp verdict (Max 3 lines).
    4. Invitation: "이제 이 운명의 도안에 당신의 의지를 불어넣을 차례입니다.\\n당신을 증명하는 상징들을 들려주시겠어요?"
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: (mode === "reveal" ? REVEAL_PROMPT : IDENTITY) }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 400 },
    });

    const response = await result.response;
    let text = response.text();

    const finalize = (str: string) => {
      return str
        .replace(/로로터스/g, "로터스")
        .replace(/(^|\s)터스 님/g, "$1로터스 님")
        .replace(/당의 /g, "당신의 ")
        .replace(/됩됩니다/g, "됩니다")
        .replace(/프리즘/g, "")
        .replace(/\[.*?\]/g, "")
        .trim();
    };

    return NextResponse.json({ role: 'ai', content: finalize(text) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}