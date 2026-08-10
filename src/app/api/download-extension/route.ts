import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

export async function GET() {
  try {
    // Générer le ZIP dynamiquement en utilisant archiver via Node.js
    const extensionPath = path.join(process.cwd(), "chrome-extension");
    const zipPath = path.join(process.cwd(), "chrome-extension.zip");

    // Utiliser archiver pour créer le ZIP
    const archiver = require("archiver");
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.pipe(output);
    archive.directory(extensionPath, false);
    await archive.finalize();

    // Attendre que le ZIP soit créé
    await new Promise<void>((resolve) => {
      output.on("close", () => resolve());
    });

    // Lire et envoyer le ZIP
    const zipBuffer = fs.readFileSync(zipPath);

    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": "attachment; filename=ai-session-live-extension.zip",
      },
    });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : String(error);
    console.error("Erreur lors de la création du ZIP:", message);
    return NextResponse.json(
      { error: "Erreur lors de la création du ZIP" },
      { status: 500 }
    );
  }
}