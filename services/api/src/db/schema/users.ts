import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  publicKey: text("public_key"), // E2E: user's encryption pubkey (Ed25519/X25519)
  encryptedPrivateKey: text("encrypted_private_key"), // E2E: scrypt-wrapped
  recoveryKeyHash: text("recovery_key_hash"), // BIP39 hashed
  plan: text("plan").notNull().default("free"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
