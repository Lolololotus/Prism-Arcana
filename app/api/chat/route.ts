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
      4. When you have sufficient information (usually after 3-4 turns), output a JSON block at the end of your response.

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
