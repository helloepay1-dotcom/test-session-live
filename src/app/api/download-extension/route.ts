import { NextResponse } from "next/server";
import archiver from "archiver";
import path from "path";
import { Readable } from "stream";

export async function GET() {
  try {
    // Créer un stream ZIP
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Compression maximale
    });

    // Créer un stream de réponse
    const response = new NextResponse(
      new Readable({
        read() {
          // Pass-through stream
        },
      }),
      {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": "attachment; filename=ai-session-live-extension.zip",
        },
      }
    );

    // Pipe l'archive vers la réponse
    archive.pipe(response as any);

    // Ajouter tous les fichiers du dossier chrome-extension
    const extensionPath = path.join(process.cwd(), "chrome-extension");
    archive.directory(extensionPath, false);

    // Finaliser l'archive
    await archive.finalize();

    return response;
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