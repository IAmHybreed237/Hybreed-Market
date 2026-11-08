import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261110000001 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "pickup_redemption" ("id" text not null, "token_hash" text not null, "order_group_id" text not null, "customer_id" text null, "redeemed_by" text null, "agent_note" text null, "redeemed_at" timestamptz not null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "pickup_redemption_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_pickup_redemption_token_hash_unique" ON "pickup_redemption" ("token_hash") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pickup_redemption_order_group_id" ON "pickup_redemption" ("order_group_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pickup_redemption_deleted_at" ON "pickup_redemption" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "pickup_redemption" cascade;`);
  }

}
