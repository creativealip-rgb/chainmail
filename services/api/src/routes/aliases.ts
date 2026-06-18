import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, eq, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { aliases as aliasesTable } from "../db/schema/index.js";
import { requireAuth, type ChainmailVars } from "../middleware/auth.js";

const createAliasSchema = z.object({
  email: z.string().email().optional(),
});

export const aliases = new Hono<{ Variables: ChainmailVars }>();

aliases.use("*", requireAuth());

function randomSlug(len = 8): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < len; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

aliases.get("/", async (c) => {
  const userId = c.get("userId");
  const rows = await db
    .select()
    .from(aliasesTable)
    .where(eq(aliasesTable.userId, userId))
    .orderBy(desc(aliasesTable.createdAt));
  return c.json({ aliases: rows });
});

aliases.post("/", zValidator("json", createAliasSchema), async (c) => {
  const userId = c.get("userId");
  const body = c.req.valid("json");

  let email: string | undefined = body.email?.toLowerCase().trim();
  if (email) {
    const taken = await db
      .select({ id: aliasesTable.id })
      .from(aliasesTable)
      .where(eq(aliasesTable.email, email))
      .limit(1);
    if (taken.length > 0) {
      return c.json({ error: "alias_taken" }, 409);
    }
  } else {
    for (let attempt = 0; attempt < 5; attempt++) {
      const slug = randomSlug();
      const candidate = `${slug}@chainmail.app`;
      const taken = await db
        .select({ id: aliasesTable.id })
        .from(aliasesTable)
        .where(eq(aliasesTable.email, candidate))
        .limit(1);
      if (taken.length === 0) {
        email = candidate;
        break;
      }
    }
    if (!email) {
      return c.json({ error: "could_not_generate_unique_alias" }, 500);
    }
  }

  const [alias] = await db
    .insert(aliasesTable)
    .values({
      userId,
      email: email!,
    })
    .returning();

  return c.json({ alias }, 201);
});

aliases.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const deleted = await db
    .delete(aliasesTable)
    .where(and(eq(aliasesTable.id, id), eq(aliasesTable.userId, userId)))
    .returning({ id: aliasesTable.id });

  if (deleted.length === 0) {
    return c.json({ error: "not_found" }, 404);
  }
  return c.json({ ok: true, id: deleted[0]!.id });
});
