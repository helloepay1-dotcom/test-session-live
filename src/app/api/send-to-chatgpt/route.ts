import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, apiKey } = body;

    if (!content || !apiKey) {
      const response = NextResponse.json(
        { error: "Content et API key requis" },
        { status: 400 }
      );
      response.headers.set("Access-Control-Allow-Origin", "*");
      return response;
    }

    // Envoyer à l'API OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Tu es un assistant IA collaboratif. Quand l'utilisateur fait une suggestion ou une correction, prends-la en compte et adapte ta réponse en conséquence."
          },
          {
            role: "user",
            content: content
          }
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      const errorResponse = NextResponse.json(
        { error: error.error?.message || "Erreur OpenAI" },
        { status: response.status }
      );
      errorResponse.headers.set("Access-Control-Allow-Origin", "*");
      return errorResponse;
    }

    const data = await response.json();
    
    const successResponse = NextResponse.json({ 
      success: true, 
      response: data.choices[0].message.content 
    });
    successResponse.headers.set("Access-Control-Allow-Origin", "*");
    return successResponse;

  } catch {
    const response = NextResponse.json(
      { error: "Erreur de traitement" },
      { status: 500 }
    );
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  }
}