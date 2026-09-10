import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";

import { projectCreateSchema, projectUpdateSchema } from "@/lib/validations";
import { resolveProjectCwd } from "../scripts/daemon/security";

// ─── Schema: Project.path ────────────────────────────────────────────────────

describe("projectCreateSchema — path field", () => {
  it("defaults path to null when omitted", () => {
    const r = projectCreateSchema.safeParse({ name: "Wild Pearl" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.path).toBeNull();
  });

  it("accepts an absolute POSIX path", () => {
    const r = projectCreateSchema.safeParse({
      name: "Wild Pearl",
      path: "/Users/basil/Desktop/Wild Pearl",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.path).toBe("/Users/basil/Desktop/Wild Pearl");
  });

  it("accepts an absolute Windows path", () => {
    const r = projectCreateSchema.safeParse({
      name: "Wild Pearl",
      path: "C:\\Users\\basil\\wild-pearl",
    });
    expect(r.success).toBe(true);
  });

  it("accepts explicit null", () => {
    const r = projectCreateSchema.safeParse({ name: "Wild Pearl", path: null });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.path).toBeNull();
  });

  it("rejects a relative path", () => {
    const r = projectCreateSchema.safeParse({ name: "Wild Pearl", path: "../wild-pearl" });
    expect(r.success).toBe(false);
  });

  it("rejects an absolute path containing a .. segment", () => {
    const r = projectCreateSchema.safeParse({
      name: "Wild Pearl",
      path: "/Users/basil/../../etc",
    });
    expect(r.success).toBe(false);
  });

  it("rejects an empty string (null is the way to unset)", () => {
    const r = projectCreateSchema.safeParse({ name: "Wild Pearl", path: "" });
    expect(r.success).toBe(false);
  });

  it("rejects a path over the length limit", () => {
    const r = projectCreateSchema.safeParse({ name: "Wild Pearl", path: "/" + "x".repeat(600) });
    expect(r.success).toBe(false);
  });
});

describe("projectUpdateSchema — path field", () => {
  it("accepts setting a path", () => {
    const r = projectUpdateSchema.safeParse({ id: "proj_1", path: "/Users/basil/Desktop/Wild Pearl" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.path).toBe("/Users/basil/Desktop/Wild Pearl");
  });

  it("accepts null to clear the path", () => {
    const r = projectUpdateSchema.safeParse({ id: "proj_1", path: null });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.path).toBeNull();
  });

  it("leaves path undefined when not supplied", () => {
    const r = projectUpdateSchema.safeParse({ id: "proj_1", status: "paused" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.path).toBeUndefined();
  });

  it("rejects a relative path", () => {
    const r = projectUpdateSchema.safeParse({ id: "proj_1", path: "wild-pearl" });
    expect(r.success).toBe(false);
  });
});

// ─── resolveProjectCwd ───────────────────────────────────────────────────────

describe("resolveProjectCwd", () => {
  let tmpDir: string;
  let realDir: string;
  let realFile: string;
  const FALLBACK = "/workspace-root";

  beforeAll(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mc-project-path-"));
    realDir = path.join(tmpDir, "wild-pearl");
    realFile = path.join(tmpDir, "notes.md");
    fs.mkdirSync(realDir);
    fs.writeFileSync(realFile, "x", "utf-8");
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns the fallback when the project path is null", () => {
    expect(resolveProjectCwd(null, FALLBACK)).toBe(FALLBACK);
  });

  it("returns the fallback when the project path is undefined", () => {
    expect(resolveProjectCwd(undefined, FALLBACK)).toBe(FALLBACK);
  });

  it("returns the project path when it exists and is a directory", () => {
    expect(resolveProjectCwd(realDir, FALLBACK)).toBe(realDir);
  });

  it("throws when the path is set but does not exist", () => {
    expect(() => resolveProjectCwd(path.join(tmpDir, "nope"), FALLBACK)).toThrow();
  });

  it("throws when the path is set but is a file", () => {
    expect(() => resolveProjectCwd(realFile, FALLBACK)).toThrow();
  });

  it("throws when the path is set but is relative", () => {
    expect(() => resolveProjectCwd("wild-pearl", FALLBACK)).toThrow();
  });

  it("never silently falls back to the workspace root for a bad path", () => {
    let returned: string | null = null;
    try {
      returned = resolveProjectCwd(path.join(tmpDir, "nope"), FALLBACK);
    } catch {
      returned = null;
    }
    expect(returned).not.toBe(FALLBACK);
  });
});
