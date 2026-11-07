import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261106122745 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "wallet_account" drop constraint if exists "wallet_account_customer_id_unique";`);
    this.addSql(`create table if not exists "wallet_account" ("id" text not null, "customer_id" text not null, "currency_code" text not null, "balance" numeric not null default 0, "points" numeric not null default 0, "metadata" jsonb null, "raw_balance" jsonb not null default '{"value":"0","precision":20}', "raw_points" jsonb not null default '{"value":"0","precision":20}', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "wallet_account_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_wallet_account_customer_id_unique" ON "wallet_account" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_wallet_account_deleted_at" ON "wallet_account" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "topup_request" ("id" text not null, "account_id" text not null, "amount" numeric not null, "currency_code" text not null, "sender_phone" text not null, "momo_reference" text null, "receipt_note" text null, "status" text check ("status" in ('pending', 'approved', 'rejected', 'cancelled')) not null default 'pending', "reviewed_by" text null, "reviewed_at" timestamptz null, "review_note" text null, "entry_id" text null, "metadata" jsonb null, "raw_amount" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "topup_request_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_topup_request_account_id" ON "topup_request" ("account_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_topup_request_deleted_at" ON "topup_request" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "wallet_entry" ("id" text not null, "account_id" text not null, "amount" numeric not null, "currency_code" text not null, "type" text check ("type" in ('topup', 'purchase', 'refund', 'points_earn', 'points_redeem', 'adjustment')) not null default 'adjustment', "status" text check ("status" in ('pending', 'completed', 'failed', 'cancelled')) not null default 'completed', "reference" text null, "order_id" text null, "description" text null, "metadata" jsonb null, "raw_amount" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "wallet_entry_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_wallet_entry_account_id" ON "wallet_entry" ("account_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_wallet_entry_deleted_at" ON "wallet_entry" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "topup_request" add constraint "topup_request_account_id_foreign" foreign key ("account_id") references "wallet_account" ("id") on update cascade;`);

    this.addSql(`alter table if exists "wallet_entry" add constraint "wallet_entry_account_id_foreign" foreign key ("account_id") references "wallet_account" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "topup_request" drop constraint if exists "topup_request_account_id_foreign";`);

    this.addSql(`alter table if exists "wallet_entry" drop constraint if exists "wallet_entry_account_id_foreign";`);

    this.addSql(`drop table if exists "wallet_account" cascade;`);

    this.addSql(`drop table if exists "topup_request" cascade;`);

    this.addSql(`drop table if exists "wallet_entry" cascade;`);
  }

}
