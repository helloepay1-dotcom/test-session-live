import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const supabase = createServerClient();

    // Marquer l'intervention comme acceptée (car elle a été envoyée à ChatGPT)
    const { error } = await supabase
      .from("interventions")
      .update({ statut: "acceptee" })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { 
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" } 
      });
    }

    return NextResponse.json({ success: true }, {
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  } catch {
    return NextResponse.json({ error: "Erreur de traitement" }, { 
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" } 
    });
  }
}