import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261108000000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "trending_event" ("id" text not null, "type" text not null, "term" text null, "product_id" text null, "category_ids" text null, "customer_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "trending_event_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_trending_event_created_at" ON "trending_event" ("created_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_trending_event_type" ON "trending_event" ("type") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_trending_event_deleted_at" ON "trending_event" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "trending_event" cascade;`);
  }

}
