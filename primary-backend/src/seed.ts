import { PrismaClient } from "@prisma/client";
const prismaClient = new PrismaClient();

async function main() {
  // Triggers
  const triggers = [
    {
      id: "webhook",
      name: "Webhook",
      image: "https://cdn-icons-png.flaticon.com/512/2165/2165004.png",
    },
    {
      id: "schedule",
      name: "Schedule",
      image: "https://cdn-icons-png.flaticon.com/512/2088/2088617.png",
    },
    {
      id: "github-trigger",
      name: "GitHub — Push",
      image: "https://cdn-icons-png.flaticon.com/512/733/733609.png",
    },
  ];

  // Actions
  const actions = [
    {
      id: "email",
      name: "Send Email",
      image: "https://cdn-icons-png.flaticon.com/512/732/732200.png",
    },
    {
      id: "slack-action",
      name: "Slack — Send Message",
      image: "https://cdn-icons-png.flaticon.com/512/2111/2111615.png",
    },
    {
      id: "http-action",
      name: "HTTP Request",
      image: "https://cdn-icons-png.flaticon.com/512/1006/1006771.png",
    },
  ];

  // upsert so re-running seed never fails on duplicate keys
  for (const t of triggers) {
    await prismaClient.availableTrigger.upsert({
      where: { id: t.id },
      update: { name: t.name, image: t.image },
      create: t,
    });
  }

  for (const a of actions) {
    await prismaClient.availableAction.upsert({
      where: { id: a.id },
      update: { name: a.name, image: a.image },
      create: a,
    });
  }

  console.log("Seed complete — 4 triggers, 3 actions");
}

main()
  .catch(console.error)
  .finally(() => prismaClient.$disconnect());