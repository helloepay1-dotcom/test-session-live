import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Readable } from "stream";

export async function GET() {
  try {
    // Créer un stream ZIP en mémoire
    const archiver = require("archiver");
    const archive = archiver("zip");

    // Créer un buffer pour stocker le ZIP
    const chunks: Buffer[] = [];
    const output = new Readable({
      read() {
        // Pass-through stream
      },
    });

    // Capturer les données du ZIP
    archive.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    // Attendre que l'archive soit finalisée
    await new Promise<void>((resolve) => {
      archive.on("end", () => resolve());
    });

    // Ajouter tous les fichiers du dossier chrome-extension
    const extensionPath = path.join(process.cwd(), "chrome-extension");
    archive.directory(extensionPath, false);

    // Finaliser l'archive
    archive.finalize();

    // Attendre un petit délai pour s'assurer que l'archive est complète
    await new Promise(resolve => setTimeout(resolve, 100));

    // Combiner tous les chunks en un seul buffer
    const zipBuffer = Buffer.concat(chunks);

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