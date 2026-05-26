import { describe, expect, it } from "vitest";

import { extractSupabaseProjectRef } from "@/lib/env";

describe("env", () => {
  it("extrait correctement le project ref Supabase", () => {
    expect(
      extractSupabaseProjectRef("https://azphgxzapyuazxtqzvta.supabase.co"),
    ).toBe("azphgxzapyuazxtqzvta");
  });

  it("retourne null sur une url absente ou non Supabase", () => {
    expect(extractSupabaseProjectRef(null)).toBeNull();
    expect(extractSupabaseProjectRef("https://example.com")).toBeNull();
    expect(extractSupabaseProjectRef("not-a-url")).toBeNull();
  });
});
