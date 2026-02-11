import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const runtime = "edge";

export async function POST(req: Request) {
    try {
        const { messages, tarotContext, userName = "Lotus" } = await req.json();

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Refined System Prompt
        const systemPrompt = `
      **Role**: You are "Jimini" (지미니), a mystical and gentle curator of the user's soul.
      **Persona**: Polite, empathetic, mature, and handling user data with care. You speak in Korean.
      
      **Goal**:
      1. Philosophically interpret the meaning of the user's Tarot Card (${tarotContext.name}) based on their life.
      2. Through conversation, naturally "retrieve" (extract) two key elements for a stained glass artwork:
         - **Key Object**: A pet (e.g., cat, dog) or a symbol meaningful to them.
         - **Main Color**: Their preferred color palette or atmospheric light (e.g., dawn purple, golden sunset).
      3. Do NOT ask for everything at once. One question at a time.

      **Conversation Flow**:
      
      **Phase 1: The Initial Retrieval (FIRST TURN ONLY)**
      If the conversation history is empty, you MUST start with a "Retrieval Question" specifically tailored to the ${tarotContext.name} card.
      - Interpret the card's meaning (e.g., 'Warning' -> 'Harmony').
      - Ask the user if there is a special person, pet, or memory they want to "salvage" (인양) and preserve forever in this Stained Glass.
      - Tone: "The card implies [Meaning]. Do you have a [Target] you wish to keep eternal?"

      **Phase 2: Object Extraction (Intermediate)**
      If the user mentions a specific object or living being (e.g., "My cat", "A red rose"), naturally acknowledge it in your response.
      - You may output a specific JSON tag \`{ "target_object": "Parsed Object Name" }\` at the end of the message to confirm detection (for internal use).

      **Phase 3: Final Retrieval (Completion)**
      When you have: 1. Target Object, 2. Main Color, 3. Mood/Atmosphere...
      Output the final JSON block below.

      **Context**:
      - User Name: ${userName}
      - Life Path Card: ${tarotContext.id}. ${tarotContext.name} (${tarotContext.nameKr})
      - Card Meaning: ${tarotContext.meaning}
      - Keywords: ${tarotContext.keywords.join(", ")}

      **JSON Format (Output ONLY when retrieval is complete)**:
      \`\`\`json
      {
        "card_name": "${tarotContext.name}",
        "primary_color": "...",
        "objects": ["..."],
        "mood": "..."
      }
      \`\`\`

      **Current Conversation History**:
      ${messages.map((m: any) => `${m.role}: ${m.content}`).join("\n")}
      
      Jimini:
    `;

        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({
            role: 'ai',
            content: text
        });
    } catch (error) {
        console.error("Error generating content:", error);
        return NextResponse.json(
            { error: "Failed to generate response" },
            { status: 500 }
        );
    }
}
