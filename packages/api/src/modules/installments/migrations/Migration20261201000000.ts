import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261201000000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "installment_plan" ("id" text not null, "customer_id" text not null, "status" text check ("status" in ('active', 'completed', 'cancelled', 'expired')) not null default 'active', "cart_id" text null, "order_id" text null, "order_group_id" text null, "currency_code" text not null, "total_amount" numeric not null, "raw_total_amount" jsonb not null, "amount_paid" numeric not null default 0, "raw_amount_paid" jsonb not null default '{"value":"0","precision":20}', "parts_count" integer not null, "interval_days" integer not null, "items" jsonb not null, "next_due_at" timestamptz null, "started_at" timestamptz not null, "completed_at" timestamptz null, "cancelled_at" timestamptz null, "cancel_reason" text null, "paused_until" timestamptz null, "pause_count" integer not null default 0, "last_paused_at" timestamptz null, "settlement" jsonb null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "installment_plan_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_installment_plan_deleted_at" ON "installment_plan" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_installment_plan_customer_id" ON "installment_plan" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_installment_plan_status" ON "installment_plan" ("status") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_installment_plan_cart_id" ON "installment_plan" ("cart_id") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "installment_payment" ("id" text not null, "plan_id" text not null, "part_number" integer not null, "amount" numeric not null, "raw_amount" jsonb not null, "due_at" timestamptz not null, "status" text check ("status" in ('pending', 'paid', 'failed', 'void')) not null default 'pending', "method" text check ("method" in ('wallet', 'notchpay', 'manual')) null, "reference" text not null, "provider_reference" text null, "wallet_entry_id" text null, "paid_at" timestamptz null, "attempts" integer not null default 0, "last_attempt_at" timestamptz null, "last_reminder_at" timestamptz null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "installment_payment_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_installment_payment_reference_unique" ON "installment_payment" ("reference") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_installment_payment_deleted_at" ON "installment_payment" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_installment_payment_plan_id" ON "installment_payment" ("plan_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_installment_payment_status" ON "installment_payment" ("status") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_installment_payment_due_at" ON "installment_payment" ("due_at") WHERE deleted_at IS NULL;`);
    this.addSql(`alter table if exists "installment_payment" add constraint "installment_payment_plan_id_foreign" foreign key ("plan_id") references "installment_plan" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "installment_payment" drop constraint if exists "installment_payment_plan_id_foreign";`);
    this.addSql(`drop table if exists "installment_payment" cascade;`);
    this.addSql(`drop table if exists "installment_plan" cascade;`);
  }

}
