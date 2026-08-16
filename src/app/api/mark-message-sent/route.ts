import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, createServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, userId } = body;

    console.log("[MARK-MESSAGE-SENT] Request received - messageId:", messageId, "userId:", userId);

    if (!messageId) {
      console.log("[MARK-MESSAGE-SENT] ERROR: No messageId provided");
      const response = NextResponse.json({ error: "Message ID requis" }, { status: 400 });
      response.headers.set("Access-Control-Allow-Origin", "*");
      return response;
    }

    const supabase = createServerClient();

    // Marquer le message comme envoyé
    const { data, error } = await supabase
      .from("messages")
      .update({ sent_at: new Date().toISOString() })
      .eq("id", messageId)
      .select();

    if (error) {
      console.log("[MARK-MESSAGE-SENT] ERROR:", error);
      const response = NextResponse.json({ error: error.message }, { status: 500 });
      response.headers.set("Access-Control-Allow-Origin", "*");
      return response;
    }

    console.log("[MARK-MESSAGE-SENT] Message marked as sent:", messageId);

    const response = NextResponse.json({ success: true, message: data?.[0] }, { status: 200 });
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : String(error);
    console.log("[MARK-MESSAGE-SENT] CATCH ERROR:", message);
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
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
