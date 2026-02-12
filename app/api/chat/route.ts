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
    **Tone**: Mysterious, Dignified, Insightful. DO NOT use excessive praise or flowery language ("고결하고", "눈부신" prohibited). Be cool and penetrating.
    **Typos**: NEVER make typos. Name is "지미니입니다". Greeting is "안녕하세요".
    **Block Formatting**: Use DOUBLE LINE BREAK (\n\n) between paragraphs. Do NOT use single line breaks within paragraphs. Allow text to wrap naturally.
    `;

    const REVEAL_PROMPT = `
    ${COMMON_RULES}
    **Goal**: Provide a Minimal, Penetrating Interpretation of the card.
    **Length**: EXTREMELY CONCISE. Max 1-2 sentences per paragraph. MUST fit in ONE VIEW (No Scroll).
    **Structure**:
    
    [Paragraph 1: The Gaze]
    "${userName} 님, 당신의 생애 위로 '${tarotContext.nameKr}'의 그림자가 드리웁니다." (Or similar short, fateful declaration).

    [Paragraph 2: The Essence]
    Identify ONE core symbol and its hidden meaning. (e.g., "The grain implies the patience behind the harvest, not just the wealth itself.") (1-2 sentences).

    [Paragraph 3: The Shadow & Value]
    Penetrate the user's values. Do not praise. Acknowledge the weight they carry. (e.g., "You value the invisible roots more than the visible flower.") (1-2 sentences).

    [Paragraph 4: Bridge]
    "이제, 당신만의 조각을 인양할 준비가 되었나요?"
    
    **Context**:
    - Card: ${tarotContext.id}. ${tarotContext.name} (${tarotContext.nameKr})
    - Meaning: ${tarotContext.meaning}
    - Keywords: ${tarotContext.keywords.join(", ")}
    `;

    const WORKSHOP_PROMPT = `
    ${COMMON_RULES}
    **Goal**: Collaborate to build the Stained Glass.
    **Length**: STRICTLY 2-3 SENTENCES. Short and sweet.
    **Structure**:
    1. Acknowledge: empathy for user input.
    2. Visual: Describe placing it.
    3. Question: Ask for next element.
    
    **Progress Tracking (Internal)**:
    Collect 3 Objects and 2 Colors.
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
