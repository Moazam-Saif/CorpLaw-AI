import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

const COOKIE_NAME = "corplaw_guest_id";
const MAX_AGE = 60 * 60 * 24 * 90; // 90 days

/**
 * Returns the current guest ID from the cookie, creating one if it doesn't
 * exist yet.  Only used when the request has no authenticated user session.
 */
export function getOrCreateGuestId(): string {
  const cookieStore = cookies();
  const existing = cookieStore.get(COOKIE_NAME)?.value;
  if (existing) return existing;

  const id = uuidv4();
  // Note: setting a cookie from a Server Component/Route Handler requires
  // Next.js 14+ cookies().set().  If you're on 13, use the Response headers
  // approach shown in the sessions API route instead.
  cookieStore.set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  return id;
}
