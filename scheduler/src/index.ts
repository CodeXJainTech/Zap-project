import { PrismaClient } from "@prisma/client";
import { Queue } from "bullmq";

const prismaClient = new PrismaClient();

const redisConnection = {
  host: process.env.REDIS_HOST ?? "localhost",
  port: parseInt(process.env.REDIS_PORT ?? "6379"),
  password: process.env.REDIS_PASSWORD ?? undefined,
};

const zapQueue = new Queue("zap-events", { connection: redisConnection });

// Interval label → cron expression
const INTERVAL_TO_CRON: Record<string, string> = {
  "every-5min": "*/5 * * * *",
  "every-15min": "*/15 * * * *",
  "every-hour": "0 * * * *",
  "every-6hours": "0 */6 * * *",
  "every-day": "0 9 * * *",
  "every-week": "0 9 * * 1",
};

async function syncScheduledZaps() {
  console.log("Syncing scheduled zaps...");

  // Find all zaps with a schedule trigger
  const scheduledZaps = await prismaClient.zap.findMany({
    where: {
      trigger: { triggerId: "schedule" },
    },
    include: {
      trigger: true,
      zapRuns: { orderBy: { id: "desc" }, take: 1 },
    },
  });

  console.log(`Found ${scheduledZaps.length} scheduled zaps`);

  for (const zap of scheduledZaps) {
    const meta = zap.trigger?.metadata as Record<string, any>;
    const interval = meta?.interval ?? "every-hour";
    const cron: string = INTERVAL_TO_CRON[interval] ?? "0 * * * *"; // every hour

    const jobId = `schedule-${zap.id}`;

    // BullMQ repeatable job — fires on cron, creates a ZapRun each time
    await zapQueue.add(
      "scheduled-zap",
      { zapId: zap.id },
      {
        jobId,
        repeat: { pattern: cron },
        removeOnComplete: true,
      },
    );

    console.log(`Scheduled zap ${zap.id} with cron: ${cron}`);
  }
}

// Sync on startup, then re-sync every 5 minutes
// (picks up newly created scheduled zaps)
syncScheduledZaps();
setInterval(syncScheduledZaps, 5 * 60 * 1000);

console.log("Scheduler started");