ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "direction" text DEFAULT 'inbound' NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'received' NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "status_detail" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_direction_idx" ON "messages" USING btree ("direction");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_status_idx" ON "messages" USING btree ("status");