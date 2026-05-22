import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:60px"><h2>Invalid unsubscribe link.</h2></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  if (process.env.USE_DB === "1") {
    await prisma.outreachProspect
      .update({ where: { id }, data: { status: "unsubscribed" } })
      .catch(() => null);
  }

  return new NextResponse(
    `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribed — AapKaPlot</title></head>
<body style="font-family:system-ui,sans-serif;text-align:center;padding:80px 20px;background:#f9fafb;color:#374151">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:48px;box-shadow:0 1px 4px rgba(0,0,0,.08)">
    <div style="font-size:48px;margin-bottom:16px">✓</div>
    <h1 style="font-size:24px;font-weight:700;margin-bottom:8px">You have been unsubscribed.</h1>
    <p style="color:#6b7280;margin-bottom:24px">You will no longer receive marketing emails from AapKaPlot.</p>
    <a href="https://aapkaplot.com" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Go to AapKaPlot</a>
  </div>
</body>
</html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
