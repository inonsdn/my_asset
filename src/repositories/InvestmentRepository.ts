// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;
import type { InvestmentRow, InvestmentEntryRow } from "@/lib/db/schema";
import type { Investment, InvestmentEntry } from "@/lib/types";
import { investmentFromRow, investmentToInsert, entryFromRow, entryToInsert } from "@/lib/db/mappers";
import { cache } from "@/lib/cache";

const INVESTMENTS_KEY = (pid: string) => `investments:${pid}`;
const ENTRIES_KEY = (invId: string) => `inv_entries:${invId}`;

export class InvestmentRepository {
  constructor(private readonly client: AnyClient) {}

  private isOffline() {
    return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }

  // ── Investments ───────────────────────────────────────────────

  async getAll(profileId: string): Promise<Investment[]> {
    const cached = cache.get<Investment[]>(INVESTMENTS_KEY(profileId));
    if (cached !== null) return cached;

    if (this.isOffline()) return [];

    // Fetch investments + all their entries in two queries
    const { data: invRows, error: invErr } = await this.client
      .from("investments")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: true });
    if (invErr) throw new Error(`[investments] getAll: ${invErr.message}`);

    const ids = (invRows as InvestmentRow[]).map((r) => r.id);
    let entryRows: InvestmentEntryRow[] = [];

    if (ids.length > 0) {
      const { data: entries, error: entErr } = await this.client
        .from("investment_entries")
        .select("*")
        .in("investment_id", ids)
        .order("date", { ascending: true });
      if (entErr) throw new Error(`[investment_entries] getAll: ${entErr.message}`);
      entryRows = entries as InvestmentEntryRow[];
    }

    const result = (invRows as InvestmentRow[]).map((row) => {
      const entries = entryRows
        .filter((e) => e.investment_id === row.id)
        .map(entryFromRow);
      return investmentFromRow(row, entries);
    });

    cache.set(INVESTMENTS_KEY(profileId), result);
    return result;
  }

  async upsert(profileId: string, investment: Investment): Promise<void> {
    if (!this.isOffline()) {
      const row = investmentToInsert(investment, profileId);
      const { error } = await this.client
        .from("investments")
        .upsert(row, { onConflict: "id" });
      if (error) throw new Error(`[investments] upsert: ${error.message}`);
    }
    const existing = await this.getAll(profileId);
    const updated = [
      ...existing.filter((i) => i.id !== investment.id),
      investment,
    ];
    cache.set(INVESTMENTS_KEY(profileId), updated);
  }

  async delete(profileId: string, id: string): Promise<void> {
    if (!this.isOffline()) {
      const { error } = await this.client.from("investments").delete().eq("id", id);
      if (error) throw new Error(`[investments] delete: ${error.message}`);
    }
    const existing = await this.getAll(profileId);
    cache.set(INVESTMENTS_KEY(profileId), existing.filter((i) => i.id !== id));
  }

  // ── Investment entries ────────────────────────────────────────

  async addEntry(profileId: string, investmentId: string, entry: InvestmentEntry): Promise<void> {
    if (!this.isOffline()) {
      const row = entryToInsert(entry, investmentId);
      const { error } = await this.client.from("investment_entries").insert(row as never);
      if (error) throw new Error(`[investment_entries] insert: ${error.message}`);
    }
    // Update cached investment list
    const investments = await this.getAll(profileId);
    const updated = investments.map((inv) =>
      inv.id === investmentId
        ? { ...inv, entries: [...inv.entries, entry] }
        : inv
    );
    cache.set(INVESTMENTS_KEY(profileId), updated);
  }

  async deleteEntry(profileId: string, investmentId: string, entryId: string): Promise<void> {
    if (!this.isOffline()) {
      const { error } = await this.client
        .from("investment_entries")
        .delete()
        .eq("id", entryId);
      if (error) throw new Error(`[investment_entries] delete: ${error.message}`);
    }
    const investments = await this.getAll(profileId);
    const updated = investments.map((inv) =>
      inv.id === investmentId
        ? { ...inv, entries: inv.entries.filter((e) => e.id !== entryId) }
        : inv
    );
    cache.set(INVESTMENTS_KEY(profileId), updated);
  }

  async updateEntry(profileId: string, investmentId: string, entry: InvestmentEntry): Promise<void> {
    if (!this.isOffline()) {
      const row = entryToInsert(entry, investmentId);
      const { error } = await this.client
        .from("investment_entries")
        .update(row)
        .eq("id", entry.id);
      if (error) throw new Error(`[investment_entries] update: ${error.message}`);
    }
    const investments = await this.getAll(profileId);
    const updated = investments.map((inv) =>
      inv.id === investmentId
        ? { ...inv, entries: inv.entries.map((e) => (e.id === entry.id ? entry : e)) }
        : inv
    );
    cache.set(INVESTMENTS_KEY(profileId), updated);
  }

  invalidateCache(profileId: string) {
    cache.invalidate(INVESTMENTS_KEY(profileId));
  }
}
