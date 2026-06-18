ALTER TABLE "messages" ALTER COLUMN "encrypted_body" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "body_text" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "body_html" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "parser_key" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "parsed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "read_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "messages_parser_idx" ON "messages" USING btree ("parser_key");