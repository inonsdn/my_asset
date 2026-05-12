// Singleton repository instances — import from here throughout the app.
import { supabase } from "@/lib/supabase";
import { ProfileRepository } from "./ProfileRepository";
import { CostItemRepository } from "./CostItemRepository";
import { InvestmentRepository } from "./InvestmentRepository";
import { DCAConfigRepository } from "./DCAConfigRepository";
import { RetirementConfigRepository } from "./RetirementConfigRepository";
import { PortfolioSnapshotRepository } from "./PortfolioSnapshotRepository";

export const profileRepo = new ProfileRepository(supabase);
export const costItemRepo = new CostItemRepository(supabase);
export const investmentRepo = new InvestmentRepository(supabase);
export const dcaConfigRepo = new DCAConfigRepository(supabase);
export const retirementConfigRepo = new RetirementConfigRepository(supabase);
export const snapshotRepo = new PortfolioSnapshotRepository(supabase);

export type { CostItemDomain } from "./CostItemRepository";
