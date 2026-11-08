import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261110000000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "wallet_entry" drop constraint if exists "wallet_entry_type_check";`);
    this.addSql(`alter table if exists "wallet_entry" add constraint "wallet_entry_type_check" check ("type" in ('topup', 'purchase', 'refund', 'points_earn', 'points_redeem', 'transfer', 'adjustment'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "wallet_entry" drop constraint if exists "wallet_entry_type_check";`);
    this.addSql(`alter table if exists "wallet_entry" add constraint "wallet_entry_type_check" check ("type" in ('topup', 'purchase', 'refund', 'points_earn', 'points_redeem', 'adjustment'));`);
  }

}
