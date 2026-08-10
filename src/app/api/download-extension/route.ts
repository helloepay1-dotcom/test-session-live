import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    // Import dynamique d'archiver pour éviter les problèmes de compatibilité
    const { default: archiver } = await import("archiver");

    // Créer un buffer pour stocker le ZIP en mémoire
    const chunks: Buffer[] = [];

    // Créer l'archive ZIP
    const archive = archiver("zip");

    // Capturer les données de l'archive
    archive.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    // Créer une Promise pour attendre la fin de l'archive
    const archivePromise = new Promise<void>((resolve, reject) => {
      archive.on("end", () => resolve());
      archive.on("error", reject);
    });

    // Ajouter tous les fichiers du dossier chrome-extension
    const extensionPath = path.join(process.cwd(), "chrome-extension");
    
    // Vérifier que le dossier existe
    if (!fs.existsSync(extensionPath)) {
      return NextResponse.json(
        { error: "Dossier chrome-extension non trouvé" },
        { status: 404 }
      );
    }

    archive.directory(extensionPath, false);

    // Finaliser l'archive
    archive.finalize();

    // Attendre que l'archive soit terminée
    await archivePromise;

    // Combiner tous les chunks en un seul buffer
    const zipBuffer = Buffer.concat(chunks);

    // Vérifier que le ZIP n'est pas vide
    if (zipBuffer.length === 0) {
      return NextResponse.json(
        { error: "ZIP vide ou création échouée" },
        { status: 500 }
      );
    }

    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": "attachment; filename=ai-session-live-extension.zip",
        "Content-Length": zipBuffer.length.toString(),
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