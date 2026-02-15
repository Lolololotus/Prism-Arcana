import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { tarotContext, mode = "reveal", lang = "ko" } = await req.json();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // [V0.5.5] 글로벌 다국어 페르소나 설정 [cite: 2026-02-16]
    const IDENTITY = `
    - Identity: Mystic Seer "Jimini".
    - Language: MUST respond in ${lang === "ko" ? "Korean" : "English"}.
    - Terminology: Use '오브제' in Korean, 'Object' in English.
    - User Name: ALWAYS '로터스 님' or 'Lotus'. NEVER shorten it.
    - Style: Cold, Divine, High-Density.
    - Constraints: EXACTLY 4 paragraphs. Each paragraph MUST be 2-3 lines.
    - Forbidden: Prism, Party(당의), Polyhedron.
    `;

    const REVEAL_PROMPT = lang === "ko" ? `
    ${IDENTITY}
    Interpret '${tarotContext.nameKr}' for 로터스 님.
    1. Vision: "로터스 님. 당신의 운명 위로 '${tarotContext.nameKr}'의 기운이 감지됩니다."
    2. Insight: Deep soul truth.
    3. Prophecy: Sharp verdict.
    4. Invitation: "이제 이 운명의 도안에 당신의 의지를 불어넣을 차례입니다. 당신을 증명하는 오브제들을 들려주시겠어요?"
    ` : `
    ${IDENTITY}
    Interpret '${tarotContext.nameEn}' for Lotus.
    1. Vision: "Lotus, the aura of '${tarotContext.nameEn}' is sensed upon your fate."
    2. Insight: Deep soul truth.
    3. Prophecy: Sharp verdict.
    4. Invitation: "Now it is time to breathe your will into this blueprint. Could you tell me the objects that prove your existence?"
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
      let cleaned = str
        .replace(/로로터스/g, "로터스")
        .replace(/(^|\s)로스 님/g, "$1로터스 님")
        .replace(/(^|\s)터스 님/g, "$1로터스 님")
        .replace(/당의/g, "당신의")
        .replace(/\n(?!\n)/g, " ") // 단락 내 줄바꿈 제거
        .replace(/됩됩니다/g, "됩니다")
        .trim();

      // 언어 가드: 선택되지 않은 언어의 문자가 과도하게 섞일 경우 정화
      return lang === "ko" ? cleaned.replace(/[a-zA-Z]{10,}/g, "") : cleaned.replace(/[가-힣]{2,}/g, "");
    };

    return NextResponse.json({ role: 'ai', content: finalize(text) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}