export type NameResult = { ok: true; name: string } | { ok: false; reason: string };

const NAME_PATTERN = /^[\p{Script=Han}A-Za-z0-9·._-]{2,16}$/u;

export function parseDisplayName(raw: unknown): NameResult {
  const name = String(raw ?? "").trim();
  if (!name) return { ok: false, reason: "请填写用户名。" };
  if (/\s/.test(name)) return { ok: false, reason: "用户名用 2 到 16 个字，可以是中文、字母或数字。" };
  if ([...name].length < 2 || [...name].length > 16 || !NAME_PATTERN.test(name)) {
    return { ok: false, reason: "用户名用 2 到 16 个字，可以是中文、字母或数字。" };
  }
  return { ok: true, name };
}

export function parseEmail(raw: unknown) {
  const email = String(raw ?? "").trim().toLowerCase();
  if (!email) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export function parsePhone(raw: unknown) {
  let phone = String(raw ?? "").trim().replace(/[\s-]/g, "");
  if (!phone) return null;
  if (phone.startsWith("+86")) phone = phone.slice(3);
  else if (phone.startsWith("86") && phone.length === 13) phone = phone.slice(2);
  if (!/^1[3-9]\d{9}$/.test(phone)) return null;
  return phone;
}
