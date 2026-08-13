import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { message, userId, sessionId } = await request.json();

    if (!message || !userId || !sessionId) {
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Clé API OpenAI non configurée" },
        { status: 500 }
      );
    }

    // Appel à l'API OpenAI
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
            role: "user",
            content: message,
          },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      return NextResponse.json(
        { error: "Erreur API OpenAI" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content || "";

    // Enregistrer la réponse dans Supabase
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Configuration Supabase manquante" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Enregistrer le message utilisateur
    await supabase.from("messages").insert({
      session_id: sessionId,
      contenu: message,
      role: "utilisateur",
      auteur_id: userId,
    });

    // Enregistrer la réponse assistant
    await supabase.from("messages").insert({
      session_id: sessionId,
      contenu: assistantMessage,
      role: "assistant",
      auteur_id: "openai-api",
    });

    return NextResponse.json({
      success: true,
      response: assistantMessage,
    });
  } catch (error) {
    console.error("Erreur dans send-to-openai:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}