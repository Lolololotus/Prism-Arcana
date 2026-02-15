import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { tarotContext, collectedElements = { objects: [], colors: [] }, mode = "reveal" } = await req.json();
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // [V0.3.8] 직관적 신비주의 & 3줄 제한 규칙 [cite: 2026-02-16]
    const IDENTITY = `
    - Identity: Mystic Seer "Jimini".
    - User: ALWAYS '로터스 님'. NEVER say '터스' or '로로터스'.
    - Style: Short, Mystic, Direct. (현학적 표현 금지, 신비롭지만 명확하게)
    - Length Rule: EXACTLY 4 paragraphs. Each paragraph MUST be 2-3 lines.
    - Forbidden words: Prism, Polyhedron, Refraction, Party(당의).
    `;

    const REVEAL_PROMPT = `
    ${IDENTITY}
    Interpret '${tarotContext.nameKr}' for 로터스 님.
    1. Vision: Start with "로터스 님. 당신의 운명 위로 '${tarotContext.nameKr}'의 기운이 감지됩니다."
    2. Insight: The hidden truth of their soul.
    3. Prophecy: A sharp final verdict.
    4. Invitation: "이제 이 운명의 도안에 당신의 의지를 불어넣을 차례입니다.\\n당신을 증명하는 상징들을 들려주시겠어요?"
    `;

    const WORKSHOP_PROMPT = `
    - Identity: The Architect.
    - Style: Concise, Functional (1-2 lines).
    - Task: Guide the creation of the 3 items and 2 colors.
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: (mode === "reveal" ? REVEAL_PROMPT : WORKSHOP_PROMPT) }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 400 },
    });

    const response = await result.response;
    let text = response.text();

    // [V0.3.8] 최종 오타 박멸 및 호칭 성역화 로직 [cite: 2026-02-16]
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