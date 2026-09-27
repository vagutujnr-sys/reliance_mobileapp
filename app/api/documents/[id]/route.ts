import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/server/context";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await getSession();
  if (!session) return new NextResponse("Sign in required.", { status: 401 });
  const repo = await db();
  const drivers = await repo.listDrivers();
  let found: { url: string; driverId: string; fileName: string } | null = null;
  for (const driver of drivers) {
    const documents = await repo.listDocuments(driver.id);
    const match = documents.find((item) => item.id === id);
    if (match) {
      found = match;
      break;
    }
  }
  if (!found) return new NextResponse("Document not found.", { status: 404 });
  const owner = drivers.find((driver) => driver.id === found?.driverId);
  const staff = session.role === "admin" || session.role === "super_admin";
  if (!staff && owner?.profileId !== session.sub) return new NextResponse("Not allowed.", { status: 403 });
  if (found.url.startsWith("private://")) {
    const file = path.join(process.cwd(), "storage", "private", found.url.replace("private://", ""));
    try {
      const body = await readFile(file);
      return new NextResponse(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Content-Disposition": `inline; filename="${found.fileName}"` } });
    } catch {
      return new NextResponse("Document is registered but the file is not in private storage yet.", { status: 404 });
    }
  }
  return NextResponse.redirect(new URL(found.url, "http://local"));
}
