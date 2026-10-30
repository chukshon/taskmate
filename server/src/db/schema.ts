import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const bots = pgTable(
  "bots",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => nanoid()),
    userId: text().notNull(),
    name: text().notNull(),
    avatar: text()
      .notNull()
      .$defaultFn(() => nanoid()),
    job: text().notNull(),
    instructions: text(),
    sandboxId: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("bots_user_id_idx").on(table.userId)],
);

export type Bot = typeof bots.$inferSelect;
export type NewBot = typeof bots.$inferInsert;

export const botInsertSchema = createInsertSchema(bots, {
  name: (schema) => schema.trim().min(1, "Give your bot a name.").max(50, "Keep it under 50 characters."),
  avatar: (schema) => schema.trim().min(1, "Choose a face.").max(100, "Keep the face seed under 100 characters."),
  job: (schema) => schema.trim().min(1, "Tell your bot what its job is.").max(100, "Keep it under 100 characters."),
  instructions: (schema) => schema.trim().max(4000, "Keep it under 4000 characters."),
}).omit({ id: true, userId: true, sandboxId: true, createdAt: true });

export type BotInsert = z.infer<typeof botInsertSchema>;
