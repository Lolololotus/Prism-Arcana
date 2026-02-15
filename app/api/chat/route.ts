import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { tarotContext, mode = "reveal" } = await req.json();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // [V0.4.6] 서사 농도 복원: 신비롭지만 날카로운 통찰 [cite: 2026-02-11, 2026-02-16]
    const IDENTITY = `
    - Identity: Mystic Seer "Jimini".
    - User: ALWAYS '로터스 님'. NEVER say '터스' or '로로터스'.
    - Tone: Deep, Cold, Intuitive. Use metaphors of 'Fate' and 'Soul'.
    - Constraints: EXACTLY 4 paragraphs. Each paragraph MUST be 2-3 lines.
    - Forbidden: Prism, Party(당의), Polyhedron.
    `;

    const REVEAL_PROMPT = `
    ${IDENTITY}
    Task: Interpret '${tarotContext.nameKr}' for 로터스 님. [cite: 2026-02-16]
    1. Vision: Start with "로터스 님. 당신의 운명 위로 '${tarotContext.nameKr}'의 기운이 감지됩니다."
    2. Insight: Reveal the hidden contradiction in their soul. (2-3 lines)
    3. Prophecy: Give a sharp, unavoidable verdict. (2-3 lines)
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
      generationConfig: { temperature: 0.8, maxOutputTokens: 500 },
    });

    const response = await result.response;
    let text = response.text();

    // [V0.4.6] 최종 오타 박멸 필터 [cite: 2026-02-16]
    const finalize = (str: string) => {
      return str
        .replace(/로로터스/g, "로터스")
        .replace(/(^|\s)터스 님/g, "$1로터스 님")
        .replace(/당의/g, "당신의")
        .replace(/됩됩니다/g, "됩니다")
        .trim();
    };

    return NextResponse.json({ role: 'ai', content: finalize(text) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}