import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");
    const currentUserId = searchParams.get("user_id");

    console.log("[POLL-MESSAGES] Request received - sessionId:", sessionId, "userId:", currentUserId);

    if (!sessionId) {
      console.log("[POLL-MESSAGES] ERROR: No sessionId provided");
      return NextResponse.json({ error: "Session ID requis" }, { status: 400 });
    }

    const supabase = createServerClient();

    // Récupérer tous les messages utilisateur récents sauf ceux de l'utilisateur actuel
    let query = supabase
      .from("messages")
      .select("*")
      .eq("session_id", sessionId)
      .eq("role", "utilisateur")
      .order("date_creation", { ascending: false })
      .limit(10);

    // Si un userId est fourni, exclure ses propres messages
    if (currentUserId) {
      console.log("[POLL-MESSAGES] Excluding messages from user:", currentUserId);
      query = query.neq("auteur_id", currentUserId);
    } else {
      console.log("[POLL-MESSAGES] No userId provided, returning all user messages");
    }

    const { data: messages, error } = await query;

    if (error) {
      console.log("[POLL-MESSAGES] ERROR:", error);
      return NextResponse.json({ error: error.message }, { 
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" } 
      });
    }

    console.log("[POLL-MESSAGES] Messages found:", messages?.length || 0);
    console.log("[POLL-MESSAGES] Messages:", messages);

    return NextResponse.json({ messages: messages || [] }, { 
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      }
    });
  } catch (error) {
    console.log("[POLL-MESSAGES] CATCH ERROR:", error);
    return NextResponse.json({ error: "Erreur de traitement" }, { 
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" } 
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}