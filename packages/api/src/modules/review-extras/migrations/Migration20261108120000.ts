import { Migration } from "@medusajs/framework/mikro-orm/migrations";

const ts = `"created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null`;

export class Migration20261108120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "review_detail" ("id" text not null, "review_id" text not null, "product_id" text null, "variant_id" text null, "variant_label" text null, "language" text null, "translations" jsonb null, "edited_at" timestamptz null, "is_demo" boolean not null default false, ${ts}, constraint "review_detail_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_review_detail_review_id_unique" ON "review_detail" ("review_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_review_detail_product_id" ON "review_detail" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_review_detail_deleted_at" ON "review_detail" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "review_media" ("id" text not null, "review_id" text not null, "product_id" text not null, "type" text check ("type" in ('image', 'video')) not null default 'image', "url" text not null, "thumbnail_url" text null, "rank" integer not null default 0, ${ts}, constraint "review_media_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_review_media_review_id" ON "review_media" ("review_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_review_media_product_id" ON "review_media" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_review_media_deleted_at" ON "review_media" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "review_reaction" ("id" text not null, "review_id" text not null, "actor_key" text not null, "type" text check ("type" in ('like', 'heart', 'clap')) not null, ${ts}, constraint "review_reaction_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_review_reaction_review_id" ON "review_reaction" ("review_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_review_reaction_unique" ON "review_reaction" ("review_id", "actor_key", "type") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_review_reaction_deleted_at" ON "review_reaction" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "review_report" ("id" text not null, "review_id" text not null, "actor_key" text not null, "reason" text null, ${ts}, constraint "review_report_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_review_report_review_id" ON "review_report" ("review_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_review_report_deleted_at" ON "review_report" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "review_author_follow" ("id" text not null, "follower_id" text not null, "author_id" text not null, ${ts}, constraint "review_author_follow_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_review_author_follow_follower_id" ON "review_author_follow" ("follower_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_review_author_follow_author_id" ON "review_author_follow" ("author_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_review_author_follow_unique" ON "review_author_follow" ("follower_id", "author_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_review_author_follow_deleted_at" ON "review_author_follow" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "review_author_follow" cascade;`);
    this.addSql(`drop table if exists "review_report" cascade;`);
    this.addSql(`drop table if exists "review_reaction" cascade;`);
    this.addSql(`drop table if exists "review_media" cascade;`);
    this.addSql(`drop table if exists "review_detail" cascade;`);
  }

}
