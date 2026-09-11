import { describe, it, expect } from "vitest";
import { decisionCreateSchema, decisionUpdateSchema, LIMITS } from "@/lib/validations";
import { deriveResolution } from "@/lib/proposal";

// A decision becomes a proposal by carrying a recommended default, a door type,
// evidence and an expiry. status stays pending|answered (upstream's lifecycle);
// resolution records HOW it was answered. See DECISIONS.md MC-004.

const BASE = {
  question: "Which framework?",
  options: ["React", "Vue", "Svelte"],
};

describe("decisionCreateSchema — proposal fields", () => {
  it("defaults every proposal field so a plain upstream decision still parses", () => {
    const r = decisionCreateSchema.safeParse({ question: "Plain question?" });
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.recommendedOption).toBeNull();
    expect(r.data.door).toBeNull();
    expect(r.data.evidence).toBe("");
    expect(r.data.expiresAt).toBeNull();
    expect(r.data.onExpiry).toBeNull();
  });

  it("accepts a fully specified proposal", () => {
    const r = decisionCreateSchema.safeParse({
      ...BASE,
      recommendedOption: "React",
      door: "two_way",
      evidence: "Team already knows it; bundle size within budget.",
      expiresAt: "2026-09-12T09:00:00.000Z",
      onExpiry: "apply_recommendation",
    });
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.recommendedOption).toBe("React");
    expect(r.data.door).toBe("two_way");
    expect(r.data.onExpiry).toBe("apply_recommendation");
  });

  it("rejects a recommendedOption that is not one of the options", () => {
    const r = decisionCreateSchema.safeParse({ ...BASE, recommendedOption: "Angular" });
    expect(r.success).toBe(false);
  });

  it("rejects a recommendedOption when there are no options", () => {
    const r = decisionCreateSchema.safeParse({ question: "Q?", recommendedOption: "Yes" });
    expect(r.success).toBe(false);
  });

  it("rejects an unknown door type", () => {
    const r = decisionCreateSchema.safeParse({ ...BASE, door: "revolving" });
    expect(r.success).toBe(false);
  });

  it("rejects onExpiry without expiresAt", () => {
    const r = decisionCreateSchema.safeParse({ ...BASE, onExpiry: "reject" });
    expect(r.success).toBe(false);
  });

  it("rejects onExpiry=apply_recommendation without a recommendedOption", () => {
    const r = decisionCreateSchema.safeParse({
      ...BASE,
      expiresAt: "2026-09-12T09:00:00.000Z",
      onExpiry: "apply_recommendation",
    });
    expect(r.success).toBe(false);
  });

  it("rejects an expiresAt that is not a parseable date", () => {
    const r = decisionCreateSchema.safeParse({ ...BASE, expiresAt: "next tuesday" });
    expect(r.success).toBe(false);
  });

  it("rejects evidence over the context limit", () => {
    const r = decisionCreateSchema.safeParse({ ...BASE, evidence: "x".repeat(LIMITS.CONTEXT + 1) });
    expect(r.success).toBe(false);
  });
});

describe("decisionUpdateSchema — proposal fields", () => {
  it("accepts each resolution value", () => {
    for (const resolution of ["accepted", "edited", "rejected", "expired"]) {
      const r = decisionUpdateSchema.safeParse({ id: "dec_1", resolution });
      expect(r.success, resolution).toBe(true);
    }
  });

  it("rejects an unknown resolution", () => {
    const r = decisionUpdateSchema.safeParse({ id: "dec_1", resolution: "maybe" });
    expect(r.success).toBe(false);
  });

  it("still rejects 'open' as a status — the lifecycle is unchanged", () => {
    const r = decisionUpdateSchema.safeParse({ id: "dec_1", status: "open" });
    expect(r.success).toBe(false);
  });

  it("accepts clearing expiresAt with null", () => {
    const r = decisionUpdateSchema.safeParse({ id: "dec_1", expiresAt: null });
    expect(r.success).toBe(true);
  });

  it("leaves proposal fields undefined when not supplied", () => {
    const r = decisionUpdateSchema.safeParse({ id: "dec_1", answer: "Vue" });
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.resolution).toBeUndefined();
    expect(r.data.door).toBeUndefined();
  });
});

describe("deriveResolution", () => {
  it("returns the explicit resolution when one is given", () => {
    expect(deriveResolution({ recommendedOption: "React", resolution: null }, "React", "rejected")).toBe("rejected");
  });

  it("is accepted when the answer equals the recommendation", () => {
    expect(deriveResolution({ recommendedOption: "React", resolution: null }, "React", undefined)).toBe("accepted");
  });

  it("is edited when the answer differs from the recommendation", () => {
    expect(deriveResolution({ recommendedOption: "React", resolution: null }, "Vue", undefined)).toBe("edited");
  });

  it("is null when there was no recommendation to accept or edit", () => {
    expect(deriveResolution({ recommendedOption: null, resolution: null }, "Vue", undefined)).toBeNull();
  });

  it("keeps the existing resolution when no answer arrives", () => {
    expect(deriveResolution({ recommendedOption: "React", resolution: "expired" }, undefined, undefined)).toBe("expired");
    expect(deriveResolution({ recommendedOption: "React", resolution: "expired" }, null, undefined)).toBe("expired");
  });

  it("compares trimmed answers so a trailing space is still an accept", () => {
    expect(deriveResolution({ recommendedOption: "React", resolution: null }, "React ", undefined)).toBe("accepted");
  });
});
