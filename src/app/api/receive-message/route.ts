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
      return NextResponse.json(
        { error: "Clé API invalide" },
        { status: 401 },
        { headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Validate required fields
    if (!session_id || !contenu || !role) {
      console.log("[RECEIVE-MESSAGE] ERROR: Missing required fields");
      return NextResponse.json(
        { error: "Champs requis : session_id, contenu, role" },
        { 
          status: 400,
          headers: { "Access-Control-Allow-Origin": "*" } 
        }
      );
    }

    if (!["utilisateur", "assistant"].includes(role)) {
      console.log("[RECEIVE-MESSAGE] ERROR: Invalid role");
      return NextResponse.json(
        { error: "role doit être 'utilisateur' ou 'assistant'" },
        { 
          status: 400,
          headers: { "Access-Control-Allow-Origin": "*" } 
        }
      );
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
      return NextResponse.json(
        { error: "Erreur de connexion Supabase" },
        { 
          status: 500,
          headers: { "Access-Control-Allow-Origin": "*" } 
        }
      );
    }

    const sessions = await sessionResponse.json();
    if (!sessions || sessions.length === 0) {
      console.log("[RECEIVE-MESSAGE] ERROR: Session not found");
      return NextResponse.json(
        { error: "Session introuvable" },
        { 
          status: 404,
          headers: { "Access-Control-Allow-Origin": "*" } 
        }
      );
    }

    const session = sessions[0];
    if (session.statut !== "actif") {
      console.log("[RECEIVE-MESSAGE] ERROR: Session inactive");
      return NextResponse.json(
        { error: "Session terminée" },
        { 
          status: 410,
          headers: { "Access-Control-Allow-Origin": "*" } 
        }
      );
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
      return NextResponse.json(
        { error: error.message || "Erreur d'insertion" },
        { 
          status: 500,
          headers: { "Access-Control-Allow-Origin": "*" } 
        }
      );
    }

    const message = await messageResponse.json();
    console.log("[RECEIVE-MESSAGE] SUCCESS: Message inserted", message);
    
    return NextResponse.json({ success: true, message }, { 
      status: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",
      }
    });
  } catch (error) {
    console.log("[RECEIVE-MESSAGE] CATCH ERROR:", error);
    return NextResponse.json(
      { error: "Requête invalide" },
      { 
        status: 400,
        headers: { "Access-Control-Allow-Origin": "*" } 
      }
    );
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
