import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

export async function GET() {
  try {
    const archiverModule = await import("archiver");

    const archiver = (
      archiverModule as unknown as {
        default?: (
          format: string,
          options?: Record<string, unknown>
        ) => any;
      }
    ).default ?? (
      archiverModule as unknown as (
        format: string,
        options?: Record<string, unknown>
      ) => any
    );

    const chunks: Buffer[] = [];

    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    archive.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    const archivePromise = new Promise<void>((resolve, reject) => {
      archive.on("end", () => resolve());
      archive.on("error", (error: Error) => reject(error));
    });

    const extensionPath = path.join(
      process.cwd(),
      "chrome-extension"
    );

    if (!fs.existsSync(extensionPath)) {
      return NextResponse.json(
        {
          error: "Dossier chrome-extension non trouvé",
        },
        { status: 404 }
      );
    }

    archive.directory(extensionPath, false);

    await archive.finalize();

    await archivePromise;

    const zipBuffer = Buffer.concat(chunks);

    if (zipBuffer.length === 0) {
      return NextResponse.json(
        {
          error: "ZIP vide ou création échouée",
        },
        { status: 500 }
      );
    }

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition":
          'attachment; filename="ai-session-live-extension.zip"',
        "Content-Length": zipBuffer.length.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    console.error(
      "Erreur lors de la création du ZIP:",
      message
    );

    return NextResponse.json(
      {
        error: "Erreur lors de la création du ZIP",
        details: message,
      },
      { status: 500 }
    );
  }
}