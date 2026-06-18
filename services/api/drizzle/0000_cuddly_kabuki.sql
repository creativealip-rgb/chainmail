CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"public_key" text,
	"encrypted_private_key" text,
	"recovery_key_hash" text,
	"plan" text DEFAULT 'free' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"user_agent" text,
	"ip" text,
	"refresh_expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "aliases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email" text NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "aliases_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alias_id" uuid NOT NULL,
	"message_id_header" text,
	"from_addr" text NOT NULL,
	"from_name" text,
	"to_addrs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"subject" text,
	"encrypted_body" text NOT NULL,
	"receipt_id" uuid,
	"received_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"source" text NOT NULL,
	"type" text NOT NULL,
	"chain" text,
	"asset" text,
	"amount" numeric(36, 18),
	"asset_price_usd" numeric(18, 8),
	"tx_hash" text,
	"counterparty" text,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"raw" jsonb NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aliases" ADD CONSTRAINT "aliases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_alias_id_aliases_id_fk" FOREIGN KEY ("alias_id") REFERENCES "public"."aliases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "aliases_user_idx" ON "aliases" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "messages_alias_idx" ON "messages" USING btree ("alias_id");--> statement-breakpoint
CREATE INDEX "messages_received_idx" ON "messages" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "receipts_message_idx" ON "receipts" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "receipts_type_idx" ON "receipts" USING btree ("type");--> statement-breakpoint
CREATE INDEX "receipts_occurred_idx" ON "receipts" USING btree ("occurred_at");