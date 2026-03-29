import { PrismaClient } from "@prisma/client";
import { Queue } from "bullmq";

const client = new PrismaClient();

const zapQueue = new Queue("zap-events", {
  connection: {
    host: process.env.REDIS_HOST ?? "localhost",
    port: parseInt(process.env.REDIS_PORT ?? "6379"),
    password: process.env.REDIS_PASSWORD ?? undefined,
  },
});

async function main() {
  console.log("Processor started — polling outbox every 3s");

  while (true) {
    const pendingRows = await client.zapRunOutbox.findMany({
      where: {},
      take: 10,
    });

    if (pendingRows.length > 0) {
      // Enqueue ALL jobs before deleting from outbox — prevents data loss
      await Promise.all(
        pendingRows.map((r) =>
          zapQueue.add(
            "zap-run",
            { zapRunId: r.zapRunId, stage: 0 },
            {
              jobId: r.zapRunId, // idempotent — safe to re-add
              attempts: 3,
              backoff: { type: "exponential", delay: 2000 },
            }
          )
        )
      );

      await client.zapRunOutbox.deleteMany({
        where: { id: { in: pendingRows.map((x) => x.id) } },
      });

      console.log(`Enqueued ${pendingRows.length} jobs`);
    }

    await new Promise((r) => setTimeout(r, 3000));
  }
}

main().catch((err) => {
  console.error("Processor crashed:", err);
  process.exit(1);
});