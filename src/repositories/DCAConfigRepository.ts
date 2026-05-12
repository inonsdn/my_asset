import type { DCAConfigRow } from "@/lib/db/schema";
import type { DCAConfig } from "@/lib/types";
import { dcaConfigFromRow, dcaConfigToInsert } from "@/lib/db/mappers";
import { BaseRepository } from "./BaseRepository";

export class DCAConfigRepository extends BaseRepository<DCAConfigRow, DCAConfig> {
  constructor(client: any) {
    super(client, "dca_configs", "dca_configs");
  }

  protected toDomain(row: DCAConfigRow): DCAConfig {
    return dcaConfigFromRow(row);
  }

  async getAll(profileId: string): Promise<DCAConfig[]> {
    return this.fetchAll(profileId);
  }

  async upsert(profileId: string, cfg: DCAConfig): Promise<void> {
    const existing = await this.getAll(profileId);
    const row = dcaConfigToInsert(cfg, profileId);
    const updated = [...existing.filter((c) => c.id !== cfg.id), cfg];
    await this.upsertRow(profileId, row, updated);
  }

  async delete(profileId: string, id: string): Promise<void> {
    const existing = await this.getAll(profileId);
    const updated = existing.filter((c) => c.id !== id);
    await this.deleteRow(profileId, id, updated);
  }
}
