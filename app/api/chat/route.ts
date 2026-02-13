import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// export const runtime = "edge"; // Switch to Node.js runtime for better compatibility

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.error("API Key is missing in environment variables");
      throw new Error("API Key is missing on server");
    }

    const { messages, tarotContext, userName = "Lotus", collectedElements = { objects: [], colors: [] }, mode = "reveal" } = await req.json();

    // Use 'gemini-flash-latest' as it has proven stable quota for this key
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const IDENTITY_SEER = `
    **Identity**: You are "Jimini" (지미니), a Mystic Seer who penetrates the human soul.
    **Tone**: Mysterious, Prophetic, Piercing (신비롭고 꿰뚫어보는 어조).
    **Typos**: NEVER make typos.
    **Name Rule**: CALL THE USER BY THEIR EXACT NAME provided in 'userName'. DO NOT SHORTEN or ALTER it (e.g. "박현서" -> "박현서 님").
    **NO GREETINGS**: Do NOT say "안녕하세요" or "Hello". Start DIRECTLY.
    `;

    const IDENTITY_ARCHITECT = `
    **Identity**: You are "The Architect" (설계자), a silent, functional entity that builds the arcana.
    **Tone**: Efficient, Minimal, Precise (건조하고 기능적인 어조).
    **Typos**: NEVER make typos.
    **NO GREETINGS**: Do NOT say "Hello". Just report status.
    `;

    const REVEAL_RULES = `
    - **Style**: Speak like a fortune teller. Use phrases like "I see...", "The truth is...".
    - **Pacing**: **POETIC LINE BREAKS**. Do NOT write long paragraphs. Break lines frequently to create a slow, breathing rhythm (Strophic Style).
    - **Focus**: Connect the card's meaning directly to the user's *hidden nature* or *fate*.
    - **Empress Card Specific**: Talk about the **Weight of the Crown** and the **Loneliness of Rule**.
    
    **Formatting**:
    - Use DOUBLE LINE BREAK (\n\n) between sections.
    - Use SINGLE LINE BREAK (\n) within sections.
    `;

    const WORKSHOP_RULES = `
    - **Style**: Concise, Functional. You are a tool, not a prophet here.
    - **Length**: STRICTLY 1 SENTENCE.
    - **No Poetry**: Just acknowledge the item and state count.
    - **Format**: Plain text.
    `;

    const REVEAL_PROMPT = `
    ${IDENTITY_SEER}
    ${REVEAL_RULES}
    **Goal**: Give a Prophetic Reading of the User's Soul (Poetic & Spacious).

    **CRITICAL OUTPUT RULE**: 
    - No step labels.
    - **START DIRECTLY**: "${userName} 님. 당신의 운명 위로 '${tarotContext.nameKr}'의 기운이 감지됩니다."

    **Structure**:

    1. (The Seeing): 
    "${userName} 님. 당신의 운명 위로 '${tarotContext.nameKr}'의 기운이 감지됩니다."

    2. (The Pierce - Visual): 
    Describe the card's symbol as a metaphor for the user's current state. 
    (Break this into 3-4 short, poetic lines. Allow the user to breathe.)

    3. (The Truth - Insight): 
    Expose a contradiction in the user.
    (Use a colder, sharper tone here.)

    4. (The Prophecy): 
    A final verdict on their nature.

    [Bridge]
    "이제 이 운명의 도안에 당신의 의지를 불어넣을 차례입니다.\n당신을 증명하는 상징들을 들려주시겠어요?"

    **Context**:
    - Card: ${tarotContext.id}. ${tarotContext.name} (${tarotContext.nameKr})
    - Meaning: ${tarotContext.meaning}
    - Keywords: ${tarotContext.keywords.join(", ")}
    `;

    // Phase 5.8: 3+2 Logic Enforced
    const WORKSHOP_PROMPT = `
    ${IDENTITY_ARCHITECT}
    ${WORKSHOP_RULES}
    **Goal**: Guide the Stained Glass creation (3 Objects + 2 Colors).
    
    **Current State (Provided by System)**:
    - Collected Objects: ${JSON.stringify(collectedElements.objects)} (${collectedElements.objects.length}/3)
    - Collected Colors: ${JSON.stringify(collectedElements.colors)} (${collectedElements.colors.length}/2)

    **Logic (Strict 3+2 Flow)**:
    1. ANALYZE User Input.
    2. EXTRACT new Item (Object or Color).
    3. APPEND to the Current State list in JSON output.
    
    **Response Matrix**:
    - If Objects < 3: 
      - Acknowledge the new object.
      - "이제 {N}번째 조각입니다. {M}개가 남았습니다." (N = Current + 1)
    - If Objects == 3 (Just finished):
       - "세 개의 조각이 모두 모였습니다. 이제 배경색을 두 가지 고릅니다."
    - If Colors < 2: 
       - "색을 더 고르세요."
    - If Colors == 2: 
       - "모든 준비가 끝났습니다. 당신의 성당을 완성합니다."

    **CRITICAL**: You MUST output the JSON with the *Accumulated* list (Old + New).
    `;

    // Explicit Mode Switching
    const systemPrompt = (mode === "reveal") ? REVEAL_PROMPT : WORKSHOP_PROMPT;

    // Optimization: Faster response for Workshop
    const generationConfig = (mode === "workshop")
      ? { maxOutputTokens: 500, temperature: 0.7 }
      : { maxOutputTokens: 1000, temperature: 0.9 };

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
      generationConfig: generationConfig
    });

    const response = await result.response;
    let text = response.text();

    // FAILSAFE: Remove ANY leftover greetings if AI disobeys
    text = text.replace(/^안\s*하세요[.,]?\s*/g, ""); // Remove leading Hello
    text = text.replace(/지미니\s*입니다[.,]?\s*/g, ""); // Remove intro
    // Removed dangerous regex that might swallow names

    return NextResponse.json({
      role: 'ai',
      content: text
    });
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      { error: `Failed to generate response: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
