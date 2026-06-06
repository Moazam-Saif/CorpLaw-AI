import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

const GUEST_COOKIE = "corplaw_guest_id";
const GUEST_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

function getGuestId(): { guestId: string; isNew: boolean } {
  const cookieStore = cookies();
  const existing = cookieStore.get(GUEST_COOKIE)?.value;
  if (existing) return { guestId: existing, isNew: false };
  return { guestId: uuidv4(), isNew: true };
}

// ─── GET /api/sessions ────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const authSession = await getServerSession(authOptions);

    if (authSession?.user) {
      // Authenticated: return all sessions belonging to this user
      const userId = (authSession.user as any).id as string;
      const sessions = await prisma.chatSession.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(sessions);
    }

    // Guest: return sessions for this browser's guest ID
    const { guestId } = getGuestId();
    const sessions = await prisma.chatSession.findMany({
      where: { guestId, userId: null },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

// ─── POST /api/sessions ───────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const authSession = await getServerSession(authOptions);

    if (authSession?.user) {
      // Authenticated user
      const userId = (authSession.user as any).id as string;
      const session = await prisma.chatSession.create({
        data: { title: "New Session", userId },
      });
      return NextResponse.json(session);
    }

    // Guest user – ensure they have a persistent cookie
    const { guestId, isNew } = getGuestId();
    const session = await prisma.chatSession.create({
      data: { title: "New Session", guestId },
    });

    const response = NextResponse.json(session);
    if (isNew) {
      response.cookies.set(GUEST_COOKIE, guestId, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: GUEST_MAX_AGE,
      });
    }
    return response;
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
