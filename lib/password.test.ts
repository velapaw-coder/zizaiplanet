import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, passwordError, verifyPassword } from "./password";

test("password length is checked before hashing", () => {
  assert.equal(passwordError("short"), "密码用 8 到 64 位。");
  assert.equal(passwordError("long-enough"), null);
});

test("stored password is a PBKDF2 hash, not the original text", async () => {
  const hash = await hashPassword("garden-path");
  assert.equal(hash.startsWith("pbkdf2$"), true);
  assert.equal(hash.includes("garden-path"), false);
  assert.equal(await verifyPassword("garden-path", hash), true);
  assert.equal(await verifyPassword("other-path", hash), false);
  assert.equal(await verifyPassword("garden-path", null), false);
});
