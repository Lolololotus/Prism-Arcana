import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: "API Key missing" }, { status: 500 });
        }

        // Nano Banana / Imagen 3 Endpoint (Beta)
        // Using REST API as SDK support for Image Gen can be varying
        const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                instances: [
                    {
                        prompt: prompt,
                    },
                ],
                parameters: {
                    sampleCount: 1,
                    aspectRatio: "1:1", // Square for Stained Glass
                    // personGeneration: "allow_adult", // Optional, depending on filters
                },
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Imagen API Error:", errorData);
            throw new Error(errorData.error?.message || "Failed to generate image");
        }

        const data = await response.json();

        // Response format verification needed for Imagen 3
        // Usually predictions[0].bytesBase64Encoded or similar
        const imageBase64 = data.predictions?.[0]?.bytesBase64Encoded;

        if (!imageBase64) {
            throw new Error("No image data returned");
        }

        return NextResponse.json({
            image: `data:image/png;base64,${imageBase64}`
        });

    } catch (error) {
        console.error("Error generating image:", error);
        return NextResponse.json(
            { error: "Failed to generate image" },
            { status: 500 }
        );
    }
}
