import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, deliveryZonesTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";
import { z } from "zod";

const router: IRouter = Router();

const DeliveryZoneBody = z.object({
  nameEn: z.string().min(1, "English name required").max(100).trim(),
  nameAr: z.string().min(1, "Arabic name required").max(100).trim(),
  fee: z.number().min(0, "Fee cannot be negative").max(100000, "Fee seems unreasonably high"),
  active: z.boolean().optional().default(true),
});

const DeliveryZonePatchBody = DeliveryZoneBody.partial().refine(
  (data) => Object.values(data).some((v) => v !== undefined),
  { message: "At least one field must be provided" }
);

// ── Public: list active delivery zones ────────────────────────────────────────
router.get("/delivery-zones", async (_req, res): Promise<void> => {
  const zones = await db
    .select()
    .from(deliveryZonesTable)
    .where(eq(deliveryZonesTable.active, true));
  res.json(zones.map((z) => ({
    id: z.id,
    nameEn: z.nameEn,
    nameAr: z.nameAr,
    fee: parseFloat(String(z.fee ?? "0")),
  })));
});

// ── Admin: list all zones (including inactive) ────────────────────────────────
router.get("/admin/delivery-zones", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  const zones = await db.select().from(deliveryZonesTable);
  res.json(zones.map((z) => ({
    id: z.id,
    nameEn: z.nameEn,
    nameAr: z.nameAr,
    fee: parseFloat(String(z.fee ?? "0")),
    active: z.active,
    createdAt: z.createdAt.toISOString(),
  })));
});

// ── Admin: create zone ────────────────────────────────────────────────────────
router.post("/admin/delivery-zones", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const result = DeliveryZoneBody.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation failed", details: result.error.issues });
    return;
  }
  const { nameEn, nameAr, fee, active } = result.data;
  const [zone] = await db.insert(deliveryZonesTable).values({
    nameEn, nameAr,
    fee: String(fee),
    active,
  }).returning();
  res.status(201).json({ id: zone.id, nameEn: zone.nameEn, nameAr: zone.nameAr, fee: parseFloat(String(zone.fee)), active: zone.active });
});

// ── Admin: update zone ────────────────────────────────────────────────────────
router.patch("/admin/delivery-zones/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (!id) { res.status(400).json({ error: "Invalid zone ID" }); return; }
  const patchResult = DeliveryZonePatchBody.safeParse(req.body);
  if (!patchResult.success) {
    res.status(400).json({ error: "Validation failed", details: patchResult.error.issues });
    return;
  }
  const { nameEn, nameAr, fee, active } = patchResult.data;
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (nameEn !== undefined) updates.nameEn = nameEn;
  if (nameAr !== undefined) updates.nameAr = nameAr;
  if (fee !== undefined)    updates.fee = String(fee);
  if (active !== undefined) updates.active = active;
  const [updated] = await db.update(deliveryZonesTable).set(updates as any).where(eq(deliveryZonesTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Zone not found" }); return; }
  res.json({ id: updated.id, nameEn: updated.nameEn, nameAr: updated.nameAr, fee: parseFloat(String(updated.fee)), active: updated.active });
});

// ── Admin: delete zone ────────────────────────────────────────────────────────
router.delete("/admin/delivery-zones/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (!id) { res.status(400).json({ error: "Invalid zone ID" }); return; }
  await db.delete(deliveryZonesTable).where(eq(deliveryZonesTable.id, id));
  res.json({ message: "Zone deleted" });
});

export default router;
