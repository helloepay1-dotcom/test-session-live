import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");
    const currentUserId = searchParams.get("user_id");

    console.log("[POLL-MESSAGES] Request received - sessionId:", sessionId, "userId:", currentUserId);

    if (!sessionId) {
      console.log("[POLL-MESSAGES] ERROR: No sessionId provided");
      const response = NextResponse.json({ error: "Session ID requis" }, { status: 400 });
      response.headers.set("Access-Control-Allow-Origin", "*");
      return response;
    }

    const supabase = createApiClient();

    // Récupérer les messages utilisateur récents sauf ceux de l'utilisateur actuel
    // ET qui n'ont pas encore été envoyés (sent_at IS NULL)
    let query = supabase
      .from("messages")
      .select("*")
      .eq("session_id", sessionId)
      .eq("role", "utilisateur")
      .is("sent_at", null)
      .order("date_creation", { ascending: true })
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
      const response = NextResponse.json({ error: error.message }, { status: 500 });
      response.headers.set("Access-Control-Allow-Origin", "*");
      return response;
    }

    // Filet de sécurité : marquer immédiatement ces messages comme envoyés.
    // Comme chaque message n'est délivré qu'à UN utilisateur par appel, le
    // marquage ici garantit « au plus une injection » même si l'extension
    // échoue ensuite à appeler /api/mark-message-sent (avant : re-poll →
    // re-injection en boucle → doublons dans la salle).
    if (messages && messages.length > 0) {
      const ids = messages.map((m) => m.id);
      const { error: updateError } = await supabase
        .from("messages")
        .update({ sent_at: new Date().toISOString() })
        .in("id", ids);
      if (updateError) {
        console.log("[POLL-MESSAGES] WARN: mark-sent failed:", updateError.message);
      }
    }

    console.log("[POLL-MESSAGES] Messages found:", messages?.length || 0);
    console.log("[POLL-MESSAGES] Messages:", messages);

    const response = NextResponse.json({ messages: messages || [] }, { status: 200 });
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : String(error);
    console.log("[POLL-MESSAGES] CATCH ERROR:", message);
    const response = NextResponse.json({ error: "Erreur de traitement" }, { status: 500 });
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
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