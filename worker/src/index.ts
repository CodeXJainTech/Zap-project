import { PrismaClient } from "@prisma/client";
import type { JsonObject } from "@prisma/client/runtime/library";
import { Worker, Queue } from "bullmq";
import { parse } from "./parsing.js";
import { sendEmail } from "./emailing.js";
import { decrypt } from "./crypto.js";

const prismaClient = new PrismaClient();

const redisConnection = {
  host: process.env.REDIS_HOST ?? "localhost",
  port: parseInt(process.env.REDIS_PORT ?? "6379"),
  password: process.env.REDIS_PASSWORD ?? undefined,
};

const zapQueue = new Queue("zap-events", { connection: redisConnection });

async function executeStage(zapRunId: string, stage: number) {
  const zapRunDetails = await prismaClient.zapRun.findFirst({
    where: { id: zapRunId },
    include: {
      zap: {
        include: {
          actions: {
            include: { type: true },
            orderBy: { sortingOrder: "asc" },
          },
        },
      },
    },
  });

  if (!zapRunDetails) throw new Error(`ZapRun ${zapRunId} not found`);

  const currentAction = zapRunDetails.zap.actions.find(
    (x) => x.sortingOrder === stage,
  );

  if (!currentAction) {
    console.log(`No action at stage ${stage} — run complete`);
    return;
  }

  const meta = currentAction.metadata as JsonObject;
  const zapRunMetadata = zapRunDetails.metadata;

  // Email action
  if (currentAction.type.id === "email") {
    // Use resolved values from previous webhook run if available
    // Otherwise parse templates from ZapRun metadata (webhook body)
    const to =
      (meta?.resolvedEmail as string) ||
      parse(meta?.email as string, zapRunMetadata);
    const body =
      (meta?.resolvedBody as string) ||
      parse(meta?.body as string, zapRunMetadata);
    const fromEmail = meta?.fromEmail as string | undefined;

    // Validate required fields before attempting send
    if (!to) {
      throw new Error(
        `Email action has no recipient. Action metadata: ${JSON.stringify(meta)}. ` +
          `This usually means the zap was created before metadata was saved correctly — delete and recreate the zap.`,
      );
    }
    if (!fromEmail) {
      throw new Error("Email action has no sender Gmail address configured.");
    }

    let appPassword: string | undefined;
    if (meta?.appPassword) {
      try {
        appPassword = decrypt(meta.appPassword as string);
      } catch {
        throw new Error(
          "Failed to decrypt email credentials — check ENCRYPTION_KEY",
        );
      }
    }

    console.log(`Sending email to ${to} from ${fromEmail}`);
    const sent = await sendEmail(to, body, fromEmail, appPassword);
    if (!sent) throw new Error(`Email to ${to} failed`);

    // Save resolved values back to Action so scheduled runs
    // can use them directly without needing ZapRun metadata
    await prismaClient.action.update({
      where: { id: currentAction.id },
      data: {
        metadata: {
          ...meta,
          resolvedEmail: to,
          resolvedBody: body,
        },
      },
    });
  }

  // HTTP request action
  if (currentAction.type.id === "http-action") {
    const url = parse(meta?.url as string, zapRunMetadata);
    const method = (meta?.method as string) ?? "POST";
    const headers = (meta?.headers as Record<string, string>) ?? {};
    const bodyTemplate = meta?.body as string | undefined;

    console.log(`HTTP ${method} ${url}`);

    const fetchOptions: RequestInit = {
      method,
      headers: { "Content-Type": "application/json", ...headers },
    };

    if (bodyTemplate && !["GET", "HEAD"].includes(method.toUpperCase())) {
      fetchOptions.body = parse(bodyTemplate, zapRunMetadata);
    }

    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(
        `HTTP request failed: ${response.status} ${response.statusText}`,
      );
    }
    console.log(`HTTP request succeeded: ${response.status}`);
  }

  // Slack action
  if (currentAction.type.id === "slack-action") {
    const webhookUrl = meta?.webhookUrl as string;
    const message = parse(meta?.message as string, zapRunMetadata);

    if (!webhookUrl) throw new Error("Slack webhook URL not configured");

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
    });

    if (!response.ok)
      throw new Error(`Slack message failed: ${response.status}`);
    console.log("Slack message sent");
  }

  // Queue next stage
  const lastStage = (zapRunDetails.zap.actions?.length || 1) - 1;
  if (lastStage !== stage) {
    console.log(`Queuing stage ${stage + 1}`);
    await zapQueue.add(
      "zap-run",
      { zapRunId, stage: stage + 1 },
      { attempts: 3, backoff: { type: "exponential", delay: 2000 } },
    );
  }

  console.log(`Stage ${stage} complete`);
}

const worker = new Worker(
  "zap-events",
  async (job) => {
    console.log(`Job ${job.id} type: ${job.name}`);

    // Scheduled zap
    if (job.name === "scheduled-zap") {
      const { zapId } = job.data;

      // Find the most recent ZapRun to copy its metadata
      const lastRun = await prismaClient.zapRun.findFirst({
        where: { zapId },
        orderBy: { id: "desc" },
      });

      // Create a new ZapRun for this execution, copying metadata from the last run
      const metadata = lastRun?.metadata
        ? {
            ...(lastRun.metadata as object),
            triggeredBy: "schedule",
            triggeredAt: new Date().toISOString(),
          }
        : { triggeredBy: "schedule", triggeredAt: new Date().toISOString() };

      const run = await prismaClient.zapRun.create({
        data: { zapId, metadata },
      });

      console.log(`Created ZapRun ${run.id} for scheduled zap ${zapId}`);
      await executeStage(run.id, 0);
      return;
    }

    // Webhook/processor triggered zap
    const { zapRunId, stage } = job.data;
    await executeStage(zapRunId, stage);
  },
  { connection: redisConnection, concurrency: 5 },
);

worker.on("completed", (job) => console.log(`Job ${job.id} completed`));
worker.on("failed", (job, err) =>
  console.error(`Job ${job?.id} failed: ${err.message}`),
);

console.log("Worker started — listening for jobs");
