// app/api/logo/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    // Intentar PNG primero, luego SVG
    const formats = [
      { file: "logo.webp", type: "image/webp" },
      { file: "logo.png", type: "image/png" },
      { file: "logo.jpg", type: "image/jpeg" },
      { file: "logo.svg", type: "image/svg+xml" },
    ];

    for (const format of formats) {
      const logoPath = path.join(
        process.cwd(),
        "src",
        "assets",
        "images",
        format.file
      );

      if (fs.existsSync(logoPath)) {
        console.log(`✅ Logo encontrado: ${format.file}`);
        const logoBuffer = fs.readFileSync(logoPath);

        return new NextResponse(logoBuffer, {
          status: 200,
          headers: {
            "Content-Type": format.type,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
    }

    // Si no encuentra ningún logo
    console.log("❌ No se encontró ningún logo");
    return NextResponse.json(
      { error: "No logo found in any supported format" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error serving logo:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
