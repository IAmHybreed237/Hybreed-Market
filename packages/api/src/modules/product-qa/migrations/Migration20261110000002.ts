import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261110000002 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "product_question" ("id" text not null, "product_id" text not null, "customer_id" text null, "author_name" text not null, "body" text not null, "answer" text null, "status" text check ("status" in ('pending', 'answered')) not null default 'pending', "answered_at" timestamptz null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_question_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_question_product_id" ON "product_question" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_question_status" ON "product_question" ("status") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_question_deleted_at" ON "product_question" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "product_question" cascade;`);
  }

}
