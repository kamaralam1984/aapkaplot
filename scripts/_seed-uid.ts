import { PrismaClient } from "@prisma/client";
const uid = process.argv[2];
if (!uid) { console.error("usage: tsx _seed-uid.ts <uid>"); process.exit(1); }
const p = new PrismaClient();
(async () => {
  const u = await p.user.upsert({
    where: { id: uid },
    create: { id: uid, phone: "+91" + Math.floor(7000000000 + Math.random() * 2999999999), email: "broker.test@aapkaplot.local", name: "Demo Broker", role: "BUYER" },
    update: {},
  });
  console.log("seeded", u.id, "role=" + u.role);
  await p.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
