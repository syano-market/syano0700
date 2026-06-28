import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // Turnstile not configured — allow through

  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: token, remoteip: ip }),
    });
    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

// POST /api/contact — public, no auth required
router.post("/contact", async (req, res): Promise<void> => {
  const name    = String(req.body?.name    ?? "").trim();
  const email   = String(req.body?.email   ?? "").trim();
  const subject = String(req.body?.subject ?? "").trim();
  const message = String(req.body?.message ?? "").trim();
  const tsToken = String(req.body?.tsToken ?? "");
  const ip      = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
                  ?? req.socket.remoteAddress
                  ?? "";

  // Input validation
  if (name.length < 2) {
    res.status(400).json({ error: "name_too_short" });
    return;
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    res.status(400).json({ error: "invalid_email" });
    return;
  }
  if (!subject) {
    res.status(400).json({ error: "subject_required" });
    return;
  }
  if (message.length < 10) {
    res.status(400).json({ error: "message_too_short" });
    return;
  }

  // Turnstile verification
  const turnstileEnabled = process.env.TURNSTILE_ENABLED !== "false";
  if (turnstileEnabled) {
    const valid = await verifyTurnstile(tsToken, ip);
    if (!valid) {
      res.status(400).json({ error: "turnstile_failed" });
      return;
    }
  }

  try {
    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO contact_submissions (name, email, subject, message, source_ip)
         VALUES ($1, $2, $3, $4, $5)`,
        [name, email, subject, message, ip],
      );
    } finally {
      client.release();
    }

    logger.info({ email, subject }, "[contact] New contact form submission");
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "[contact] Failed to save contact submission");
    res.status(500).json({ error: "server_error" });
  }
});

export default router;
