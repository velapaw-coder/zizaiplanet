import assert from "node:assert/strict";
import test from "node:test";
import { parseDisplayName, parseEmail, parsePhone } from "./identity";
import { formatJoinDotDate, residentNumber, roleLabel } from "./text";

test("display name is chosen by the person and stays within basic characters", () => {
  assert.deepEqual(parseDisplayName("  林间 "), { ok: true, name: "林间" });
  assert.equal(parseDisplayName("a").ok, false);
  assert.equal(parseDisplayName("这是一个明显超过十六个字的用户名呀").ok, false);
  assert.equal(parseDisplayName("hello world").ok, false);
  assert.equal(parseDisplayName("a@b").ok, false);
});

test("phone accepts mainland mobiles and email stays an address", () => {
  assert.equal(parsePhone("13800138000"), "13800138000");
  assert.equal(parsePhone("+86 138-0013-8000"), "13800138000");
  assert.equal(parsePhone("8613800138000"), "13800138000");
  assert.equal(parsePhone("12345"), null);
  assert.equal(parsePhone("23800138000"), null);
  assert.equal(parseEmail("A@Zizai.Local"), "a@zizai.local");
  assert.equal(parseEmail("not-an-email"), null);
});

test("the three roles use Chinese labels", () => {
  assert.equal(roleLabel("member"), "星球居民");
  assert.equal(roleLabel("host"), "茶主");
  assert.equal(roleLabel("admin"), "运营管理员");
});

test("resident number is stable and derived from the user id", () => {
  assert.equal(residentNumber("a1b2c3d4-e5f6-7890-abcd-ef1234567890"), "ZP-A1B2-C3D4");
  assert.equal(residentNumber("00000000-0000-0000-0000-000000000001"), "ZP-0000-0000");
});

test("join date uses dotted YYYY.MM.DD", () => {
  assert.equal(formatJoinDotDate("2026-10-26T03:00:00.000Z"), "2026.10.26");
  assert.equal(formatJoinDotDate(null), "————.——.——");
});
