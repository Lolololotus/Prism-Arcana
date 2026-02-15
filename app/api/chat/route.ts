import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { tarotContext, mode = "reveal", lang = "ko" } = await req.json();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // [V0.6.6] 이름 수호 강화 및 출력량 복구
    const IDENTITY = `
    - Identity: Mystic Seer "Jimini".
    - Name Guard: ALWAYS '로터스 님' or 'Lotus'. Shortening to '로스' is a SACRED TABOO. (신성한 금기) [cite: 2026-02-16]
    - Formatting: EXACTLY 4 paragraphs. NO line breaks WITHIN paragraphs.
    - Language: Respond ONLY in ${lang === "ko" ? "Korean" : "English"}.
    `;

    // 1단계: 해석 단계 (오브제 언급 금지)
    const REVEAL_PROMPT = `${IDENTITY}
    Task: Interpret '${lang === "ko" ? tarotContext.nameKr : tarotContext.nameEn}' for ${lang === "ko" ? "로터스 님" : "Lotus"}.
    - DO NOT mention '오브제' or 'Object' in this stage.
    - Style: Divine, Cold, High-Density.
    - Length: Each paragraph 2-3 sentences. (4 paragraphs total)
    `;

    // 2단계: 워크숍 단계 (설명충 금지, 극도로 간결하게)
    const WORKSHOP_PROMPT = `${IDENTITY}
    - Role: Stained Glass Architect.
    - Task: Guide the user to provide 3 Objects and 2 Colors. 
    - RULE: BE EXTREMELY BRIEF (MAX 2 SENTENCES). NEVER explain rules.
    - Phrase: Use '${lang === "ko" ? "오브제" : "Object"}'.
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: (mode === "reveal" ? REVEAL_PROMPT : WORKSHOP_PROMPT) }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 800 }, // 장문의 해석을 위해 800으로 복구
    });

    const finalize = (str: string) => {
      let cleaned = str
        .replace(/로스(\s?님|야|의|가|이|씨|께|에게|여)/g, "로터스$1") // 탄력적 이름 수복 (공백 유무 무관)
        .replace(/터스 님/g, "로터스 님")
        .replace(/로로터스/g, "로터스")
        .replace(/당의/g, "당신의")
        .replace(/([^\n])\n([^\n])/g, "$1 $2") // 단락 내 줄바꿈 물리적 차단
        .trim();

      // 언어 가드: 선택되지 않은 언어의 단어가 섞일 경우 물리적 정화
      return lang === "ko" ? cleaned.replace(/[a-zA-Z]{10,}/g, "") : cleaned.replace(/[가-힣]{2,}/g, "");
    };

    return NextResponse.json({ role: 'ai', content: finalize(result.response.text()) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}