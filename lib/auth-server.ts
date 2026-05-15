import { cookies } from "next/headers";
import { decodeSession, sessionCookie, type Session } from "./session";

/** Read the current session on the server (RSC, route handlers). */
export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  return decodeSession(jar.get(sessionCookie.name)?.value);
}

export async function requireSession(): Promise<Session> {
  const s = await getSession();
  if (!s) throw new Error("UNAUTHENTICATED");
  return s;
}
