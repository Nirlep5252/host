ALTER TABLE "domains" ADD COLUMN "owner_id" uuid;
ALTER TABLE "domains" ADD COLUMN "visibility" varchar(10) DEFAULT 'private' NOT NULL;
ALTER TABLE "domains" ADD COLUMN "is_approved" boolean DEFAULT false NOT NULL;

DO $$ BEGIN
  ALTER TABLE "domains" ADD CONSTRAINT "domains_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
