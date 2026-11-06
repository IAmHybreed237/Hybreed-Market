import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261106000000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "auction" ("id" text not null, "title" text not null, "description" text null, "status" text check ("status" in ('draft', 'scheduled', 'live', 'ended', 'canceled')) not null default 'scheduled', "offer_id" text not null, "product_id" text null, "seller_id" text not null, "currency_code" text not null, "starting_price" numeric not null, "raw_starting_price" jsonb not null, "bid_increment" numeric not null, "raw_bid_increment" jsonb not null, "current_price" numeric null, "raw_current_price" jsonb null, "leading_bid_id" text null, "reserve_price" numeric null, "raw_reserve_price" jsonb null, "buy_now_price" numeric null, "raw_buy_now_price" jsonb null, "deposit_amount" numeric null, "raw_deposit_amount" jsonb null, "start_at" timestamptz not null, "end_at" timestamptz not null, "extension_seconds" integer not null default 120, "extension_window_seconds" integer not null default 300, "max_extensions" integer not null default 3, "extension_count" integer not null default 0, "winner_id" text null, "winning_bid_id" text null, "ended_at" timestamptz null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "auction_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_auction_deleted_at" ON "auction" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_auction_status" ON "auction" ("status") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_auction_offer_id" ON "auction" ("offer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_auction_seller_id" ON "auction" ("seller_id") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "bid" ("id" text not null, "auction_id" text not null, "bidder_id" text not null, "amount" numeric not null, "raw_amount" jsonb not null, "standing_amount" numeric null, "raw_standing_amount" jsonb null, "deposit_reference" text null, "status" text check ("status" in ('active', 'leading', 'outbid', 'won', 'lost', 'cancelled')) not null default 'active', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "bid_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_bid_deleted_at" ON "bid" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_bid_auction_id" ON "bid" ("auction_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_bid_bidder_id" ON "bid" ("bidder_id") WHERE deleted_at IS NULL;`);
    this.addSql(`alter table if exists "bid" add constraint "bid_auction_id_foreign" foreign key ("auction_id") references "auction" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "bid" drop constraint if exists "bid_auction_id_foreign";`);
    this.addSql(`drop table if exists "bid" cascade;`);
    this.addSql(`drop table if exists "auction" cascade;`);
  }

}
