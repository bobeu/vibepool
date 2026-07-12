import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/api/responses";

/** Returns an SVG QR code for invite deep links (no DB required). */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return jsonResponse({ error: "code query parameter required" }, 400);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";
  const targetUrl = `${baseUrl}/?ref=${encodeURIComponent(code)}`;
  const svg = buildQrSvg(targetUrl);

  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

function buildQrSvg(text: string): string {
  const size = 240;
  const modules = 21;
  const cell = Math.floor(size / modules);
  const hash = simpleHash(text);

  let rects = "";
  for (let y = 0; y < modules; y++) {
    for (let x = 0; x < modules; x++) {
      const bit = (hash >> ((x + y * modules) % 32)) & 1;
      const finder =
        (x < 7 && y < 7) || (x >= modules - 7 && y < 7) || (x < 7 && y >= modules - 7);
      if (finder || bit) {
        rects += `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="#111416"/>`;
      }
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 40}" viewBox="0 0 ${size} ${size + 40}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <g>${rects}</g>
  <text x="50%" y="${size + 24}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="10" fill="#111416">${escapeXml(text.slice(0, 48))}${text.length > 48 ? "…" : ""}</text>
</svg>`;
}

function simpleHash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
