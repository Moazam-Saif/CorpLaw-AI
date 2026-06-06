import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

const COOKIE_NAME = "corplaw_guest_id";
const MAX_AGE = 60 * 60 * 24 * 90; // 90 days

/**
 * Returns the current guest ID from the cookie, creating one if it doesn't
 * exist yet.  Only used when the request has no authenticated user session.
 */
export async function getOrCreateGuestId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(COOKIE_NAME)?.value;
  if (existing) return existing;

  const id = uuidv4();
  cookieStore.set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  return id;
}