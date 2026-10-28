import { env } from "cloudflare:workers";

export function db() {
  if (!env.DB) {
    throw new Error("找不到 D1 绑定 DB。请确认 wrangler.toml，并先运行数据库迁移。");
  }
  return env.DB;
}

export async function kvGet(key: string) {
  try {
    return await env.SESSION.get(key);
  } catch (error) {
    console.error("kv get failed", error);
    return null;
  }
}

export async function kvPut(key: string, value: string, ttlSeconds: number) {
  try {
    await env.SESSION.put(key, value, { expirationTtl: ttlSeconds });
  } catch (error) {
    console.error("kv put failed", error);
  }
}

export async function kvDel(key: string) {
  try {
    await env.SESSION.delete(key);
  } catch (error) {
    console.error("kv delete failed", error);
  }
}
