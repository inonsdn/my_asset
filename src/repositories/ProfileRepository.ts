import type { ProfileRow } from "@/lib/db/schema";
import type { FinancialProfile } from "@/lib/types";
import { profileFromRow } from "@/lib/db/mappers";
import { cache } from "@/lib/cache";

const CACHE_KEY_PREFIX = "profile";
const CACHE_KEY = (id: string) => `${CACHE_KEY_PREFIX}:${id}`;

type ProfileDomain = Omit<FinancialProfile, "monthlyCosts" | "yearlyCosts">;

export class ProfileRepository {
  constructor(private readonly client: any) {}

  private isOffline() {
    return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }

  async get(profileId: string): Promise<ProfileDomain | null> {
    const cached = cache.get<ProfileDomain>(CACHE_KEY(profileId));
    if (cached) return cached;

    if (this.isOffline()) return null;

    const { data, error } = await this.client
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .maybeSingle();

    if (error) throw new Error(`[profiles] get: ${error.message}`);
    if (!data) return null;

    const result = profileFromRow(data as ProfileRow);
    cache.set(CACHE_KEY(profileId), result);
    return result;
  }

  async upsert(profileId: string, profile: ProfileDomain): Promise<void> {
    if (!this.isOffline()) {
      const row: ProfileRow = {
        id: profileId,
        monthly_income: profile.monthlyIncome,
        yearly_bonus_income: profile.yearlyBonusIncome,
        currency: profile.currency,
        monthly_income_currency: profile.monthlyIncomeCurrency ?? "USD",
        yearly_bonus_income_currency: profile.yearlyBonusIncomeCurrency ?? "USD",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { error } = await this.client
        .from("profiles")
        .upsert(row, { onConflict: "id" });
      if (error) throw new Error(`[profiles] upsert: ${error.message}`);
    }
    cache.set(CACHE_KEY(profileId), profile);
  }

  invalidateCache(profileId: string) {
    cache.invalidate(CACHE_KEY(profileId));
  }
}
