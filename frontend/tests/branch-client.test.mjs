import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");

test("branch client exposes typed branch CRUD helpers", () => {
  const source = read("src/app/lib/branch-client.ts");

  assert.match(source, /export type BranchStatus = "active" \| "inactive" \| "all"/);
  assert.match(source, /export interface BranchResponse/);
  assert.match(source, /export interface BranchCreateRequest/);
  assert.match(source, /export interface BranchUpdateRequest/);
  assert.match(source, /export function fetchBranches/);
  assert.match(source, /api<BranchResponse\[\]>\("\/branches"/);
  assert.match(source, /export function createBranch/);
  assert.match(source, /method:\s*"POST"/);
  assert.match(source, /export function updateBranch/);
  assert.match(source, /method:\s*"PATCH"/);
  assert.match(source, /export function deactivateBranch/);
  assert.match(source, /method:\s*"DELETE"/);
});

test("api client normalizes structured backend detail messages", () => {
  const source = read("src/app/lib/api.ts");

  assert.match(source, /interface StructuredErrorDetail/);
  assert.match(source, /detail\?: string \| PydanticErrorItem\[\] \| StructuredErrorDetail/);
  assert.match(source, /typeof body\.detail\.message === "string"/);
  assert.match(source, /return body\.detail\.message/);
});
