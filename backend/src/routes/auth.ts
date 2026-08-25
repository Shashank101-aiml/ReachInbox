import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { env } from "@/config/env";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { requireAuth, AuthedRequest } from "@/middleware/auth";

export const authRouter = Router();

function assertGoogleConfigured() {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_CALLBACK_URL) {
    throw new Error(
      "Google OAuth is not configured — set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL in backend/.env"
    );
  }
}

function oauthClient() {
  assertGoogleConfigured();
  return new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_CALLBACK_URL);
}

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function baseCookieOptions() {
  const isProd = env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? "none" : "lax") as "none" | "lax",
  };
}

function sessionCookieOptions() {
  return {
    ...baseCookieOptions(),
    maxAge: SESSION_MAX_AGE_MS,
  };
}

authRouter.get("/google", (_req, res) => {
  try {
    const client = oauthClient();
    const url = client.generateAuthUrl({
      access_type: "online",
      scope: ["openid", "email", "profile"],
      prompt: "select_account",
    });
    res.redirect(url);
  } catch (err) {
    console.error("[auth] /google failed:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "OAuth setup error" });
  }
});

authRouter.get("/google/callback", async (req, res) => {
  const code = req.query.code;
  if (typeof code !== "string") {
    return res.redirect(`${env.FRONTEND_URL}/?error=missing_code`);
  }

  try {
    const client = oauthClient();
    const { tokens } = await client.getToken(code);
    if (!tokens.id_token) throw new Error("No id_token returned from Google");

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) throw new Error("Incomplete Google profile payload");

    const [user] = await db
      .insert(users)
      .values({
        googleId: payload.sub,
        email: payload.email,
        name: payload.name ?? payload.email,
        avatarUrl: payload.picture ?? null,
      })
      .onConflictDoUpdate({
        target: users.googleId,
        set: {
          email: payload.email,
          name: payload.name ?? payload.email,
          avatarUrl: payload.picture ?? null,
        },
      })
      .returning();

    const sessionToken = jwt.sign({ id: user.id, email: user.email, name: user.name }, env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie(env.SESSION_COOKIE_NAME, sessionToken, sessionCookieOptions());
    res.redirect(`${env.FRONTEND_URL}/dashboard`);
  } catch (err) {
    console.error("[auth] Google OAuth callback failed:", err);
    res.redirect(`${env.FRONTEND_URL}/?error=oauth_failed`);
  }
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(env.SESSION_COOKIE_NAME, baseCookieOptions());
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  const [user] = await db.select().from(users).where(eq(users.id, req.user!.id));
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl });
});
