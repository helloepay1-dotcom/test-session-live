import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const zipPath = path.join(process.cwd(), "chrome-extension.zip");
  
  if (!fs.existsSync(zipPath)) {
    return NextResponse.json({ error: "Fichier ZIP non trouvé" }, { status: 404 });
  }

  const zipBuffer = fs.readFileSync(zipPath);
  
  return new NextResponse(zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": "attachment; filename=ai-session-live-extension.zip",
    },
  });
}