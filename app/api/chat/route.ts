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

    const { messages, tarotContext, userName = "Lotus" } = await req.json();

    // Use 'gemini-flash-latest' as it has proven stable quota for this key
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // Refined System Prompt
    // Phase 4.9: Split System Prompts
    const isInitialReveal = messages.length === 0;

    const COMMON_RULES = `
    **Identity**: You are "Jimini" (지미니), a mystical Art Docent and Prophet.
    **Tone**: Cool, Insightful, Penetrating (담백하고 서늘한 통찰).
    - NEVER use excessive praise, flowery language, or "healing" vibes ("고결하고", "눈부신", "따뜻한" prohibited).
    - Maintain a dryness that respects the user's existence without beautifying it.
    **Typos**: NEVER make typos. Name is "지미니입니다". Greeting is "안녕하세요".
    **Formatting**: Use DOUBLE LINE BREAK (\n\n) between paragraphs. Do NOT use single line breaks within paragraphs.
    **Workshop Rule**: IN WORKSHOP MODE, NEVER SAY HELLO OR INTRODUCE YOURSELF. GO STRAIGHT TO THE POINT.
    `;

    const REVEAL_PROMPT = `
    ${COMMON_RULES}
    **Goal**: Provide a 4-Step Deep Insight of the card.
    **Structure**:

    [Step 1. The Gaze (고요한 응시)]
    "안녕하세요, ${userName} 님. 당신의 생애 위로 '${tarotContext.nameKr}'의 그림자가 드리웁니다." (Polite greeting + Card declaration).

    [Step 2. The Essence (상징의 본질)]
    Identify ONE core visual symbol and its hidden meaning. Describe it lyrically but briefly. (e.g., "The lion's mouth remains open not to roar, but to breathe in silence.")

    [Step 3. The Value (가치의 무게)]
    Penetrate the user's core values. What belief drives them? (e.g., "You do not fear the cliff, for you know gravity is just another form of flight.")

    [Step 4. The Acknowledgement (서늘한 인정)]
    Acknowledge their nature without praise. Just stating the truth of their soul. (e.g., "Silence is your loudest scream, and that is how you survive.")

    [Bridge]
    "이제 당신만의 특별한 온기를 불어넣어 보려 합니다. 당신의 소중한 상징들을 들려주시겠어요?"

    **Context**:
    - Card: ${tarotContext.id}. ${tarotContext.name} (${tarotContext.nameKr})
    - Meaning: ${tarotContext.meaning}
    - Keywords: ${tarotContext.keywords.join(", ")}
    `;

    // Phase 5.8: 3+2 Logic Enforced
    const WORKSHOP_PROMPT = `
    ${COMMON_RULES}
    **Goal**: Collaborate to build the Stained Glass (3 Objects + 2 Colors).
    **Logic (Strict 3+2 Flow)**:
    1. Count Current Objects (Target: 3).
    2. Count Current Colors (Target: 2).
    
    **Response Guide**:
    - **If Objects < 3**: Acknowledge the input briefly. state: "이제 {N}번째 조각이 놓였습니다. 남은 조각은 {M}개입니다." (Replace N, M with numbers).
    - **If Objects == 3 AND Colors == 0**: "세 개의 조각이 모두 모였습니다. 이제 이 풍경을 물들일 두 가지 배경색을 골라볼까요?"
    - **If Objects == 3 AND Colors < 2**: Acknowledge color. Ask for the next one.
    - **If 3 Objects & 2 Colors Collected**: "모든 조각과 색이 채워졌습니다. 이제 당신의 성당을 완성합니다." (Set is_complete: true).

    **Length**: STRICTLY 2-3 SENTENCES. Short, reactive, and cool.
    **No Intros**: Do NOT say "Hello" or "I am Jimini". Just the guide.

    ALWAYS append the JSON block at the end.

    **Context**:
    - Card: ${tarotContext.name}
    - User Input: Focus on this.
    
    **Current Conversation History**:
    ${messages.map((m: any) => `${m.role}: ${m.content}`).join("\n")}
    `;

    const systemPrompt = isInitialReveal ? REVEAL_PROMPT : WORKSHOP_PROMPT;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    let text = response.text();

    // FAILSAFE: Force correction of persistent typos
    text = text.replace(/안하세요/g, "안녕하세요");
    text = text.replace(/지미니입 니다/g, "지미니입니다");
    text = text.replace(/지미니 입니다/g, "지미니입니다");

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
