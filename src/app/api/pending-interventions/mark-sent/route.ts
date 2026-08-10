import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      const response = NextResponse.json({ error: "ID requis" }, { status: 400 });
      response.headers.set("Access-Control-Allow-Origin", "*");
      return response;
    }

    const supabase = createServerClient();

    // Marquer l'intervention comme acceptée (car elle a été envoyée à ChatGPT)
    const { error } = await supabase
      .from("interventions")
      .update({ statut: "acceptee" })
      .eq("id", id);

    if (error) {
      const response = NextResponse.json({ error: error.message }, { status: 500 });
      response.headers.set("Access-Control-Allow-Origin", "*");
      return response;
    }

    const response = NextResponse.json({ success: true });
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  } catch {
    const response = NextResponse.json({ error: "Erreur de traitement" }, { status: 500 });
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  }
}