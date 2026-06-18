import { pgTable, uuid, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const aliases = pgTable(
  "aliases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    email: text("email").notNull().unique(),
    description: text("description"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("aliases_user_idx").on(t.userId),
  })
);
