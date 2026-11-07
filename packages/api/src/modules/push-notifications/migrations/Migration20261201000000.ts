import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261201000000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "push_subscription" ("id" text not null, "endpoint" text not null, "p256dh" text not null, "auth" text not null, "customer_id" text null, "user_agent" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "push_subscription_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_push_subscription_endpoint_unique" ON "push_subscription" ("endpoint") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_push_subscription_customer_id" ON "push_subscription" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_push_subscription_deleted_at" ON "push_subscription" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "push_subscription" cascade;`);
  }

}
