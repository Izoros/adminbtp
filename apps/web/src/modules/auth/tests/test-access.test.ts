import {
  getTestAccessCookieName,
  getTestAccessCookieOptions,
  getTestAccessCookieValue,
  hasTestAccessCookieValue,
  isTestAccessEnabled,
} from "@/modules/auth/services/test-access";

describe("test access", () => {
  it("expose un cookie stable pour l acces lecture seule", () => {
    expect(getTestAccessCookieName()).toBe("adminbtp_test_access");
    expect(getTestAccessCookieValue()).toBe("read_only_demo");
    expect(getTestAccessCookieOptions().path).toBe("/");
  });

  it("reconnait correctement la valeur du cookie", () => {
    expect(hasTestAccessCookieValue("read_only_demo")).toBe(true);
    expect(hasTestAccessCookieValue("autre")).toBe(false);
  });

  it("laisse l acces test actif sauf si l env le coupe explicitement", () => {
    delete process.env.NEXT_PUBLIC_ENABLE_TEST_ACCESS;
    expect(isTestAccessEnabled()).toBe(true);

    process.env.NEXT_PUBLIC_ENABLE_TEST_ACCESS = "false";
    expect(isTestAccessEnabled()).toBe(false);
  });
});
