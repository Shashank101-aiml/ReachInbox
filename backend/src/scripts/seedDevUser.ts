import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db, pool } from "@/db/client";
import { users } from "@/db/schema";
import { env } from "@/config/env";

const DEV_GOOGLE_ID = "dev-test-google-id";

async function main() {
  const [inserted] = await db
    .insert(users)
    .values({ googleId: DEV_GOOGLE_ID, email: "dev-tester@example.com", name: "Dev Tester" })
    .onConflictDoNothing()
    .returning();

  const row = inserted ?? (await db.select().from(users).where(eq(users.googleId, DEV_GOOGLE_ID)))[0];
  const token = jwt.sign({ id: row.id, email: row.email, name: row.name }, env.JWT_SECRET, {
    expiresIn: "7d",
  });

  console.log(`User id: ${row.id} (${row.email})`);
  console.log(`Cookie header for testing: ${env.SESSION_COOKIE_NAME}=${token}`);
  await pool.end();
}

main();
