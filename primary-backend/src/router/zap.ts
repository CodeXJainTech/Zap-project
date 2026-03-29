import { Router } from "express";
import { authMiddleware } from "../middleware.js";
import { prismaClient } from "../db/index.js";
import { ZapCreateSchema } from "../types/index.js";
import crypto from "crypto";
import { encrypt } from "../crypto.js";

const router = Router();

router.post("/", authMiddleware, async (req, res) => {
  // @ts-ignore
  const id: string = req.id;
  const body = req.body;
  const parsedData = ZapCreateSchema.safeParse(body);

  if (!parsedData.success) {
    console.error("ZapCreateSchema validation failed:", parsedData.error);
    return res.status(411).json({
      message: "Incorrect inputs",
      errors: parsedData.error.flatten(),
    });
  }

  const zapSecret = crypto.randomBytes(32).toString("hex");

  // Encrypt sensitive fields in action metadata before storing
  const sanitizedActions = parsedData.data.actions.map((action) => {
    const meta = { ...(action.actionMetadata ?? {}) } as Record<string, any>;
    if (meta.appPassword) {
      meta.appPassword = encrypt(meta.appPassword);
    }
    return { ...action, actionMetadata: meta };
  });

  try {
    const zapId = await prismaClient.$transaction(async tx => {
      const zap = await tx.zap.create({
        data: {
          userId: parseInt(id),
          triggerId: "",
          secret: zapSecret,
          actions: {
            create: sanitizedActions.map((x, index) => ({
              actionId: x.availableActionId,
              sortingOrder: index,
              metadata: x.actionMetadata ?? {},
            })),
          },
        },
      });

      const trigger = await tx.trigger.create({
        data: {
          triggerId: parsedData.data.availableTriggerId,
          zapId: zap.id,
          metadata: parsedData.data.triggerMetadata ?? {},
        },
      });

      await tx.zap.update({
        where: { id: zap.id },
        data: { triggerId: trigger.id },
      });

      return zap.id;
    });

    return res.json({ zapId, webhookSecret: zapSecret });
  } catch (err) {
    console.error("Zap creation failed:", err);
    return res.status(500).json({ message: "Failed to create zap" });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  // @ts-ignore
  const id = req.id;
  const zaps = await prismaClient.zap.findMany({
    where: { userId: id },
    include: {
      actions: {
        include: { type: true },
        orderBy: { sortingOrder: "asc" },
      },
      trigger: { include: { type: true } },
    },
  });
  return res.json({ zaps });
});

router.get("/:zapId", authMiddleware, async (req, res) => {
  // @ts-ignore
  const id = req.id;
  const zapId = String(req.params.zapId);
  const zap = await prismaClient.zap.findFirst({
    where: { id: zapId, userId: id },
    include: {
      actions: {
        include: { type: true },
        orderBy: { sortingOrder: "asc" },
      },
      trigger: { include: { type: true } },
    },
  });
  return res.json({ zap });
});

export const zapRouter = router;