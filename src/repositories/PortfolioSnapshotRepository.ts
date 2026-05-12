import type { PortfolioSnapshotRow } from "@/lib/db/schema";
import type { PortfolioSnapshot } from "@/lib/types";
import { snapshotFromRow, snapshotToInsert } from "@/lib/db/mappers";
import { cache } from "@/lib/cache";
import { v4 as uuid } from "@/lib/uuid";

const CACHE_KEY = (pid: string) => `portfolio_snapshots:${pid}`;

export class PortfolioSnapshotRepository {
  constructor(private readonly client: any) {}

  private isOffline() {
    return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }

  async getAll(profileId: string): Promise<PortfolioSnapshot[]> {
    const cached = cache.get<PortfolioSnapshot[]>(CACHE_KEY(profileId));
    if (cached !== null) return cached;
    if (this.isOffline()) return [];

    const { data, error } = await this.client
      .from("portfolio_snapshots")
      .select("*")
      .eq("profile_id", profileId)
      .order("snapshot_date", { ascending: true });
    if (error) throw new Error(`[portfolio_snapshots] getAll: ${error.message}`);

    const result = (data as PortfolioSnapshotRow[]).map(snapshotFromRow);
    cache.set(CACHE_KEY(profileId), result);
    return result;
  }

  async add(profileId: string, snap: Omit<PortfolioSnapshot, "id" | "createdAt">): Promise<PortfolioSnapshot> {
    const id = uuid();
    const row = snapshotToInsert(snap, profileId, id);
    if (!this.isOffline()) {
      const { error } = await this.client.from("portfolio_snapshots").insert(row as never);
      if (error) throw new Error(`[portfolio_snapshots] insert: ${error.message}`);
    }
    const full: PortfolioSnapshot = { ...snap, id, createdAt: new Date().toISOString() };
    const existing = await this.getAll(profileId);
    cache.set(CACHE_KEY(profileId), [...existing, full].sort((a, b) => a.snapshotDate.localeCompare(b.snapshotDate)));
    return full;
  }

  async delete(profileId: string, id: string): Promise<void> {
    if (!this.isOffline()) {
      const { error } = await this.client.from("portfolio_snapshots").delete().eq("id", id);
      if (error) throw new Error(`[portfolio_snapshots] delete: ${error.message}`);
    }
    const existing = await this.getAll(profileId);
    cache.set(CACHE_KEY(profileId), existing.filter((s) => s.id !== id));
  }

  invalidateCache(profileId: string) {
    cache.invalidate(CACHE_KEY(profileId));
  }
}
