import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

const GUEST_COOKIE = "corplaw_guest_id";

/** Returns true when the request is allowed to access this chat session */
function canAccess(
  session: { userId: string | null; guestId: string | null },
  authUserId: string | null,
  guestId: string | null
): boolean {
  if (authUserId && session.userId === authUserId) return true;
  if (!session.userId && guestId && session.guestId === guestId) return true;
  return false;
}

// ─── GET /api/sessions/[id] ───────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const chatSession = await prisma.chatSession.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    if (!chatSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const authSession = await getServerSession(authOptions);
    const authUserId = authSession?.user ? (authSession.user as any).id : null;
    const guestId = (await cookies()).get(GUEST_COOKIE)?.value ?? null;

    if (!canAccess(chatSession, authUserId, guestId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(chatSession);
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}

// ─── DELETE /api/sessions/[id] ────────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const chatSession = await prisma.chatSession.findUnique({ where: { id } });

    if (!chatSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const authSession = await getServerSession(authOptions);
    const authUserId = authSession?.user ? (authSession.user as any).id : null;
    const guestId = (await cookies()).get(GUEST_COOKIE)?.value ?? null;

    if (!canAccess(chatSession, authUserId, guestId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.chatSession.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting session:", error);
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }
}
