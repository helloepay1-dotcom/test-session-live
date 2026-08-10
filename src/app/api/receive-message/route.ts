import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, contenu, role, api_key, userId } = body;

    console.log("[RECEIVE-MESSAGE] Request received:", { session_id, contenu: contenu?.slice(0, 50), role, userId });

    // Validate API key
    const expectedKey = process.env.API_SECRET_KEY;
    if (!expectedKey || api_key !== expectedKey) {
      console.log("[RECEIVE-MESSAGE] ERROR: Invalid API key");
      const response = NextResponse.json({ error: "Clé API invalide" }, { status: 401 });
      response.headers.set("Access-Control-Allow-Origin", "*");
      return response;
    }

    // Validate required fields
    if (!session_id || !contenu || !role) {
      console.log("[RECEIVE-MESSAGE] ERROR: Missing required fields");
      const response = NextResponse.json({ error: "Champs requis : session_id, contenu, role" }, { status: 400 });
      response.headers.set("Access-Control-Allow-Origin", "*");
      return response;
    }

    if (!["utilisateur", "assistant"].includes(role)) {
      console.log("[RECEIVE-MESSAGE] ERROR: Invalid role");
      const response = NextResponse.json({ error: "role doit être 'utilisateur' ou 'assistant'" }, { status: 400 });
      response.headers.set("Access-Control-Allow-Origin", "*");
      return response;
    }

    // Use direct Supabase REST API
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

    console.log("[RECEIVE-MESSAGE] Connecting to Supabase...");

    // Verify session exists and is active
    const sessionResponse = await fetch(
      `${supabaseUrl}/rest/v1/sessions?id=eq.${session_id}&select=id,statut`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!sessionResponse.ok) {
      console.log("[RECEIVE-MESSAGE] ERROR: Supabase connection failed");
      const response = NextResponse.json({ error: "Erreur de connexion Supabase" }, { status: 500 });
      response.headers.set("Access-Control-Allow-Origin", "*");
      return response;
    }

    const sessions = await sessionResponse.json();
    if (!sessions || sessions.length === 0) {
      console.log("[RECEIVE-MESSAGE] ERROR: Session not found");
      const response = NextResponse.json({ error: "Session introuvable" }, { status: 404 });
      response.headers.set("Access-Control-Allow-Origin", "*");
      return response;
    }

    const session = sessions[0];
    if (session.statut !== "actif") {
      console.log("[RECEIVE-MESSAGE] ERROR: Session inactive");
      const response = NextResponse.json({ error: "Session terminée" }, { status: 410 });
      response.headers.set("Access-Control-Allow-Origin", "*");
      return response;
    }

    console.log("[RECEIVE-MESSAGE] Session validated, inserting message...");

    // Insert message with userId from extension
    const messageResponse = await fetch(
      `${supabaseUrl}/rest/v1/messages`,
      {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          session_id,
          contenu,
          role,
          auteur_id: role === "utilisateur" ? (userId || "extension-chrome") : null,
        }),
      }
    );

    if (!messageResponse.ok) {
      const error = await messageResponse.json();
      console.log("[RECEIVE-MESSAGE] ERROR: Insert failed", error);
      const response = NextResponse.json({ error: error.message || "Erreur d'insertion" }, { status: 500 });
      response.headers.set("Access-Control-Allow-Origin", "*");
      return response;
    }

    const message = await messageResponse.json();
    console.log("[RECEIVE-MESSAGE] SUCCESS: Message inserted", message);
    
    const response = NextResponse.json({ success: true, message }, { status: 201 });
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  } catch (error) {
    console.log("[RECEIVE-MESSAGE] CATCH ERROR:", error);
    const response = NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
    },
  });
}