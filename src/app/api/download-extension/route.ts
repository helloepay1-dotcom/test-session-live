import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import JSZip from "jszip";

export const runtime = "nodejs";

function addDirectoryToZip(
  zip: JSZip,
  directoryPath: string,
  relativePath = ""
) {
  const entries = fs.readdirSync(directoryPath, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    const fullPath = path.join(directoryPath, entry.name);
    const zipPath = relativePath
      ? `${relativePath}/${entry.name}` 
      : entry.name;

    if (entry.isDirectory()) {
      addDirectoryToZip(zip, fullPath, zipPath);
    } else {
      const fileBuffer = fs.readFileSync(fullPath);
      zip.file(zipPath, fileBuffer);
    }
  }
}

export async function GET() {
  try {
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

    const zip = new JSZip();

    addDirectoryToZip(zip, extensionPath);

    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: {
        level: 9,
      },
    });

    if (!zipBuffer || zipBuffer.length === 0) {
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