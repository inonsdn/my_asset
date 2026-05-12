import type { CostItemRow } from "@/lib/db/schema";
import type { CostItem } from "@/lib/types";
import { costItemFromRow, costItemToInsert } from "@/lib/db/mappers";
import { BaseRepository } from "./BaseRepository";
import { cache } from "@/lib/cache";

export type CostItemDomain = CostItem & { frequency: "monthly" | "yearly" };

export class CostItemRepository extends BaseRepository<CostItemRow, CostItemDomain> {
  constructor(client: any) {
    super(client, "cost_items", "cost_items");
  }

  protected toDomain(row: CostItemRow): CostItemDomain {
    return costItemFromRow(row);
  }

  async getAll(profileId: string): Promise<CostItemDomain[]> {
    return this.fetchAll(profileId);
  }

  async upsert(profileId: string, item: CostItem, frequency: "monthly" | "yearly"): Promise<void> {
    const existing = await this.getAll(profileId);
    const row = costItemToInsert(item, profileId, frequency);
    const updated = [
      ...existing.filter((i) => i.id !== item.id),
      { ...item, frequency },
    ];
    await this.upsertRow(profileId, row, updated);
  }

  async delete(profileId: string, id: string): Promise<void> {
    const existing = await this.getAll(profileId);
    const updated = existing.filter((i) => i.id !== id);
    await this.deleteRow(profileId, id, updated);
  }

  /** Replaces all cost items for a frequency with a new list (for bulk sync). */
  async replaceAll(
    profileId: string,
    items: CostItem[],
    frequency: "monthly" | "yearly"
  ): Promise<void> {
    if (!this.isOffline()) {
      // Delete existing for this frequency, then insert new
      const { error: delErr } = await this.client
        .from("cost_items")
        .delete()
        .eq("profile_id", profileId)
        .eq("frequency", frequency);
      if (delErr) throw new Error(`[cost_items] replaceAll delete: ${delErr.message}`);

      if (items.length > 0) {
        const rows = items.map((i) => costItemToInsert(i, profileId, frequency));
        const { error: insErr } = await this.client.from("cost_items").insert(rows as never);
        if (insErr) throw new Error(`[cost_items] replaceAll insert: ${insErr.message}`);
      }
    }
    // Merge with opposite frequency items in cache
    const existing = await this.getAll(profileId);
    const kept = existing.filter((i) => i.frequency !== frequency);
    const next = [...kept, ...items.map((i) => ({ ...i, frequency }))];
    cache.set(this.cacheKey(profileId), next);
  }
}
