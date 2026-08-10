import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID requis" }, { status: 400 });
    }

    const supabase = createServerClient();

    // Récupérer les interventions en attente
    const { data: interventions, error } = await supabase
      .from("interventions")
      .select("*")
      .eq("session_id", sessionId)
      .eq("statut", "en_attente")
      .order("date_creation", { ascending: true })
      .limit(1);

    if (error) {
      return NextResponse.json({ error: error.message }, { 
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" } 
      });
    }

    return NextResponse.json({ interventions: interventions || [] }, {
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  } catch {
    return NextResponse.json({ error: "Erreur de traitement" }, { 
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" } 
    });
  }
}