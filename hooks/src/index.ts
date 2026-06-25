import express from "express";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const app = express();
const client = new PrismaClient();

app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

function verifyHmac(
  rawBody: Buffer,
  secret: string,
  signatureHeader: string,
): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const provided = signatureHeader.replace("sha256=", "");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(provided, "hex"),
    );
  } catch {
    return false;
  }
}

app.post("/hooks/catch/:userId/:zapId", async (req: any, res: any) => {
  const { userId, zapId } = req.params;
  const signature = (req.headers["x-zap-signature"] || req.headers["x-hub-signature-256"]) as string | undefined;
  const querySecret = req.query.secret as string | undefined;

  if (!signature && !querySecret) {
    return res.status(401).json({ message: "Missing authentication (signature header or secret query parameter)" });
  }

  const zap = await client.zap.findFirst({
    where: { id: zapId, userId: parseInt(userId) },
    select: { secret: true },
  });

  if (!zap) {
    return res.status(404).json({ message: "Zap not found" });
  }

  if (signature) {
    const isValid = verifyHmac(req.rawBody, zap.secret, signature);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid signature" });
    }
  } else if (querySecret) {
    if (querySecret !== zap.secret) {
      return res.status(401).json({ message: "Invalid secret in URL" });
    }
  }

  await client.$transaction(async (tx) => {
    const run = await tx.zapRun.create({
      data: {
        zapId,
        metadata: req.body,
      },
    });

    await tx.zapRunOutbox.create({
      data: { zapRunId: run.id },
    });
  });

  return res.json({ message: "received." });
});

app.listen(3002, () => {
  console.log("Hooks server started on port 3002");
});
