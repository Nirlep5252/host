ALTER TABLE "users" DROP COLUMN IF EXISTS "api_key_hash";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" varchar(20) DEFAULT 'user' NOT NULL;--> statement-breakpoint
UPDATE "users" SET "role" = 'admin' WHERE lower("email") = 'hello@nirlep.dev';
