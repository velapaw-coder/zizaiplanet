import { db } from "./db";
import { nowIso } from "./http";

export const LLM_PRESET_KEY = "llm_default_preset";
export const LLM_MODEL_KEY = "llm_default_model";
export const COMMUNITY_WECOM_QR_KEY = "community_wecom_qr_url";
export const DEFAULT_COMMUNITY_WECOM_QR_URL = "/community-wecom-qr.png";
/** R2 object key for the community WeCom QR (MEDIA binding). */
export const COMMUNITY_WECOM_QR_MEDIA_KEY = "site/community-wecom-qr";

export async function getSiteSetting(key: string): Promise<string | null> {
  try {
    const row = await db()
      .prepare("SELECT value FROM site_settings WHERE key = ?")
      .bind(key)
      .first<{ value: string }>();
    return row?.value ?? null;
  } catch (error) {
    console.error("getSiteSetting failed", key, error);
    return null;
  }
}

export async function setSiteSetting(key: string, value: string): Promise<void> {
  await db()
    .prepare(
      `INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
    .bind(key, value, nowIso())
    .run();
}

/** Public URL for the community WeCom QR (setting, else static placeholder). */
export async function getCommunityWecomQrUrl(): Promise<string> {
  const value = (await getSiteSetting(COMMUNITY_WECOM_QR_KEY))?.trim();
  return value || DEFAULT_COMMUNITY_WECOM_QR_URL;
}

export async function getLlmPlatformChoice(): Promise<{ presetId: string | null; model: string | null }> {
  const [presetId, model] = await Promise.all([getSiteSetting(LLM_PRESET_KEY), getSiteSetting(LLM_MODEL_KEY)]);
  return {
    presetId: presetId?.trim() || null,
    model: model?.trim() || null,
  };
}

export async function saveLlmPlatformChoice(input: { presetId: string; model: string | null }) {
  await setSiteSetting(LLM_PRESET_KEY, input.presetId);
  if (input.model) await setSiteSetting(LLM_MODEL_KEY, input.model);
  else {
    // Clear override so preset default / env LLM_MODEL apply
    await db().prepare("DELETE FROM site_settings WHERE key = ?").bind(LLM_MODEL_KEY).run();
  }
}
