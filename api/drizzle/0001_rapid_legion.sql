CREATE TABLE "domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain" varchar(255) NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "domains_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
ALTER TABLE "account" RENAME COLUMN "user_id" TO "userId";--> statement-breakpoint
ALTER TABLE "account" RENAME COLUMN "account_id" TO "accountId";--> statement-breakpoint
ALTER TABLE "account" RENAME COLUMN "provider_id" TO "providerId";--> statement-breakpoint
ALTER TABLE "account" RENAME COLUMN "access_token" TO "accessToken";--> statement-breakpoint
ALTER TABLE "account" RENAME COLUMN "refresh_token" TO "refreshToken";--> statement-breakpoint
ALTER TABLE "account" RENAME COLUMN "access_token_expires_at" TO "accessTokenExpiresAt";--> statement-breakpoint
ALTER TABLE "account" RENAME COLUMN "refresh_token_expires_at" TO "refreshTokenExpiresAt";--> statement-breakpoint
ALTER TABLE "account" RENAME COLUMN "id_token" TO "idToken";--> statement-breakpoint
ALTER TABLE "account" RENAME COLUMN "created_at" TO "createdAt";--> statement-breakpoint
ALTER TABLE "account" RENAME COLUMN "updated_at" TO "updatedAt";--> statement-breakpoint
ALTER TABLE "session" RENAME COLUMN "user_id" TO "userId";--> statement-breakpoint
ALTER TABLE "session" RENAME COLUMN "expires_at" TO "expiresAt";--> statement-breakpoint
ALTER TABLE "session" RENAME COLUMN "ip_address" TO "ipAddress";--> statement-breakpoint
ALTER TABLE "session" RENAME COLUMN "user_agent" TO "userAgent";--> statement-breakpoint
ALTER TABLE "session" RENAME COLUMN "created_at" TO "createdAt";--> statement-breakpoint
ALTER TABLE "session" RENAME COLUMN "updated_at" TO "updatedAt";--> statement-breakpoint
ALTER TABLE "verification" RENAME COLUMN "expires_at" TO "expiresAt";--> statement-breakpoint
ALTER TABLE "verification" RENAME COLUMN "created_at" TO "createdAt";--> statement-breakpoint
ALTER TABLE "verification" RENAME COLUMN "updated_at" TO "updatedAt";--> statement-breakpoint
ALTER TABLE "account" DROP CONSTRAINT "account_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "session" DROP CONSTRAINT "session_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "domain" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "domain_id" uuid;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE no action ON UPDATE no action;