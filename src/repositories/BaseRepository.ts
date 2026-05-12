import { cache } from "@/lib/cache";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = any;

export abstract class BaseRepository<TRow extends { id: string }, TDomain> {
  protected constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected readonly client: AnySupabaseClient,
    protected readonly table: string,
    protected readonly cachePrefix: string
  ) {}

  protected cacheKey(profileId: string) {
    return `${this.cachePrefix}:${profileId}`;
  }

  protected abstract toDomain(row: TRow): TDomain;

  protected isOffline(): boolean {
    return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }

  protected async fetchAll(profileId: string, filterCol = "profile_id"): Promise<TDomain[]> {
    const cached = cache.get<TDomain[]>(this.cacheKey(profileId));
    if (cached !== null) return cached;
    if (this.isOffline()) return [];

    const { data, error } = await this.client
      .from(this.table)
      .select("*")
      .eq(filterCol, profileId)
      .order("created_at", { ascending: true });

    if (error) throw new Error(`[${this.table}] fetchAll: ${error.message}`);
    const result = (data as TRow[]).map((r) => this.toDomain(r));
    cache.set(this.cacheKey(profileId), result);
    return result;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected async upsertRow(profileId: string, row: any, updatedList: TDomain[]): Promise<void> {
    if (!this.isOffline()) {
      const { error } = await this.client.from(this.table).upsert(row, { onConflict: "id" });
      if (error) throw new Error(`[${this.table}] upsert: ${error.message}`);
    }
    cache.set(this.cacheKey(profileId), updatedList);
  }

  protected async deleteRow(profileId: string, id: string, updatedList: TDomain[]): Promise<void> {
    if (!this.isOffline()) {
      const { error } = await this.client.from(this.table).delete().eq("id", id);
      if (error) throw new Error(`[${this.table}] delete: ${error.message}`);
    }
    cache.set(this.cacheKey(profileId), updatedList);
  }

  invalidateCache(profileId: string) {
    cache.invalidate(this.cacheKey(profileId));
  }
}
