import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { createInterface } from "node:readline/promises";
const db = new PrismaClient();
async function main() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const email = await rl.question("Admin email: ");
  const name = await rl.question("Admin name: ");
  rl.close();
  const password = process.env.ADMIN_INITIAL_PASSWORD;
  if (!password || password.length < 12)
    throw new Error(
      "Set ADMIN_INITIAL_PASSWORD to a unique password of at least 12 characters before running this command.",
    );
  await db.user.create({
    data: {
      email: email.trim().toLowerCase(),
      name,
      passwordHash: await hash(password, 12),
      role: "SUPER_ADMIN",
    },
  });
  console.log(
    "Super administrator created. Clear ADMIN_INITIAL_PASSWORD from your environment.",
  );
}
main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
