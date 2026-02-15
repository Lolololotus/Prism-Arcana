import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { tarotContext, mode = "reveal", lang = "ko" } = await req.json();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // [V0.6.0] 이름 수호 및 줄바꿈 차단 절대 지침
    const IDENTITY = `
    - Identity: Mystic Seer "Jimini".
    - Name Guard: ALWAYS '로터스 님' or 'Lotus'. NEVER shorten to '로스' or '터스'. (CRITICAL)
    - Formatting: EXACTLY 4 paragraphs. NO line breaks WITHIN paragraphs. (단락 내부 줄바꿈 절대 금지)
    - Language: Respond ONLY in ${lang === "ko" ? "Korean" : "English"}. NEVER mix languages.
    `;

    // 1단계: 해석 단계 (오브제 언급 금지)
    const REVEAL_PROMPT = `${IDENTITY}
    Task: Interpret '${lang === "ko" ? tarotContext.nameKr : tarotContext.nameEn}' for ${lang === "ko" ? "로터스 님" : "Lotus"}.
    - DO NOT mention '오브제' or 'Object' in this stage.
    - Style: Divine, Cold, High-Density. (신비롭고 날카로운 통찰)
    - Length: Each paragraph 2-3 sentences max.
    `;

    // 2단계: 워크숍 단계 (설명충 금지, 극도로 간결하게)
    const WORKSHOP_PROMPT = `${IDENTITY}
    - Role: Stained Glass Architect.
    - Task: Guide the user to provide 3 Objects and 2 Colors. 
    - RULE: BE EXTREMELY BRIEF (MAX 2 SENTENCES). NEVER explain rules. Just acknowledge and ask for the next.
    - Phrase: Use '${lang === "ko" ? "오브제" : "Object"}'. (ex: "Cast your light. Tell me an object.")
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: (mode === "reveal" ? REVEAL_PROMPT : WORKSHOP_PROMPT) }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 200 }, // 일관성을 위해 온도를 살짝 낮춤
    });

    const finalize = (str: string) => {
      let cleaned = str
        .replace(/로스 님/g, "로터스 님") // 이름 오염 복구
        .replace(/터스 님/g, "로터스 님") // 이름 오염 복구
        .replace(/로로터스/g, "로터스")
        .replace(/당의/g, "당신의")
        .replace(/됩됩니다/g, "됩니다")
        // [V0.6.0] 단락 내부 싱글 줄바꿈(\n)을 물리적으로 삭제하여 가독성 고정
        .replace(/([^\n])\n([^\n])/g, "$1 $2")
        .trim();

      // 언어 가드: 선택되지 않은 언어의 단어가 섞일 경우 물리적 정화
      return lang === "ko" ? cleaned.replace(/[a-zA-Z]{10,}/g, "") : cleaned.replace(/[가-힣]{2,}/g, "");
    };

    return NextResponse.json({ role: 'ai', content: finalize(result.response.text()) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}