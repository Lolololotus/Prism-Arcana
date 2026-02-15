import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { tarotContext, mode = "reveal" } = await req.json();
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const IDENTITY = `
    - Identity: Mystic Seer "Jimini".
    - User: ALWAYS '로터스 님'. NEVER say '터스' or '로로터스'.
    - Style: Short, Mystic, Intuitive. 
    - Constraints: Max 3 lines per paragraph. No 'Prism', No 'Party'(당의).
    `;

    const REVEAL_PROMPT = `
    ${IDENTITY}
    Interpret '${tarotContext.nameKr}' for 로터스 님.
    1. Vision: Start with "로터스 님. 당신의 운명 위로 '${tarotContext.nameKr}'의 기운이 감지됩니다."
    2. Insight: Deep soul truth (2-3 lines).
    3. Prophecy: Sharp verdict (2-3 lines).
    4. Invitation: "이제 이 운명의 도안에 당신의 의지를 불어넣을 차례입니다.\\n당신을 증명하는 상징들을 들려주시겠어요?"
    `;

    const WORKSHOP_PROMPT = `
    ${IDENTITY}
    - Role: Stained Glass Architect.
    - Task: Guide the user to choose 3 objects and 2 colors. 
    - Respond concisely to the user's input.
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: (mode === "reveal" ? REVEAL_PROMPT : WORKSHOP_PROMPT) }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
    });

    const response = await result.response;
    let text = response.text();

    const finalize = (str: string) => {
      return str
        .replace(/로로터스/g, "로터스")
        .replace(/(^|\s)터스 님/g, "$1로터스 님")
        .replace(/당의/g, "당신의") // '당의' 오타 원천 박멸
        .replace(/됩됩니다/g, "됩니다")
        .replace(/프리즘/g, "")
        .trim();
    };

    return NextResponse.json({ role: 'ai', content: finalize(text) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}