import { Router, Request, Response } from "express";
import { storage } from "../db";

const router = Router();

/**
 * GET /api/storage
 * Required query param: ?prefix=<string>
 * Lists all keys that start with the given prefix.
 * This route must be defined BEFORE the /:key(*) wildcard route.
 */
router.get("/", (req: Request, res: Response) => {
  const prefix = typeof req.query.prefix === "string" ? req.query.prefix : "";
  const rows = storage.list(prefix);
  return res.json({ keys: rows.map((r) => r.key) });
});

/**
 * GET /api/storage/:key
 * Retrieve a single value by key.
 * The `:key(*)` wildcard allows keys that contain slashes or colons
 * (e.g. "debate:1234567890").
 */
router.get("/:key(*)", (req: Request, res: Response) => {
  const key = decodeURIComponent(req.params.key);
  const row = storage.get(key);
  if (!row) {
    return res.json({ key, value: null });
  }
  return res.json({ key: row.key, value: row.value });
});

/**
 * PUT /api/storage/:key
 * Body: { value: string }
 * Upsert a value.
 */
router.put("/:key(*)", (req: Request, res: Response) => {
  const key = decodeURIComponent(req.params.key);
  const { value } = req.body as { value?: string };
  if (typeof value !== "string") {
    return res.status(400).json({ error: "body.value must be a string" });
  }
  storage.set(key, value);
  return res.json({ ok: true });
});

/**
 * DELETE /api/storage/:key
 * Remove a key.
 */
router.delete("/:key(*)", (req: Request, res: Response) => {
  const key = decodeURIComponent(req.params.key);
  storage.delete(key);
  return res.json({ ok: true });
});

export default router;
