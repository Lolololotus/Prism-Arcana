import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { tarotContext, mode = "reveal", lang = "ko", rawName } = await req.json();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const TARGET_NAME = rawName && rawName.trim() !== "" ? rawName : (lang === "ko" ? "로터스" : "Lotus");

    // [V0.7.5] 극강의 페르소나 락: 자기소개 금지, 토큰 확장, 그리고 단락 압축 (2문장/3줄)
    const IDENTITY = `
    - Identity: Mystic Seer "Jimini".
    - User: '${TARGET_NAME} 님'.
    - RULE: NEVER introduce yourself. NEVER say "I am Jimini".
    - RULE: START directly with the card's energy.
    - Format: EXACTLY 4 paragraphs. NO line breaks WITHIN paragraphs.
    - Constraint: Each paragraph MUST be within 2 sentences and 3 lines of text. (단락당 2문장, 3줄 이내로 극도로 압축할 것) [cite: 2026-02-16]
    `;

    const REVEAL_PROMPT = `${IDENTITY}
    Interpret '${lang === "ko" ? tarotContext.nameKr : tarotContext.nameEn}' for ${TARGET_NAME} 님.
    - Style: Divine, Cold, High-Density.
    - P1 Start: MUST start with "${TARGET_NAME} 님, 당신의 운명 위로..."
    - P2-3: Core soul truth and sharp prophecy.
    - P4: End with a mystical invitation to the workshop.
    - Length: Exactly 4 paragraphs. Max 2 sentences per paragraph.
    - CRITICAL: Use the user's name '${TARGET_NAME}' throughout.
    `;

    const WORKSHOP_PROMPT = `${IDENTITY}
    - Role: Stained Glass Architect.
    - Task: Guide the user to provide 3 Objects and 2 Colors. 
    - RULE: EXTREMELY BRIEF (MAX 2 SENTENCES). NEVER explain rules.
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: (mode === "reveal" ? REVEAL_PROMPT : WORKSHOP_PROMPT) }] }],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 1000, // [V0.7.5] 해석 완독을 위해 1000까지 확장
        topP: 0.8
      },
    });

    const finalize = (str: string) => {
      let cleaned = str
        .replace(/로스 님|터스 님/g, `${TARGET_NAME} 님`) // 호칭 오염 복구
        .replace(/로로터스/g, TARGET_NAME)
        .replace(/당의/g, "당신의")
        .replace(/([^\n])\n([^\n])/g, "$1 $2") // 단락 내 줄바꿈 물리적 차단
        .trim();

      if (!cleaned.endsWith('.') && !cleaned.endsWith('?') && !cleaned.endsWith('!')) {
        cleaned += ".";
      }
      return cleaned;
    };

    return NextResponse.json({ role: 'ai', content: finalize(result.response.text()) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}