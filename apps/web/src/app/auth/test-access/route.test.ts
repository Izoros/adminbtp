import { GET as enableTestAccess } from "@/app/auth/test-access/route";
import { GET as disableTestAccess } from "@/app/auth/test-access/logout/route";
import { getTestAccessCookieName } from "@/modules/auth/services/test-access";

describe("test-access-route", () => {
  it("active une session de test lecture seule", async () => {
    process.env.NEXT_PUBLIC_ENABLE_TEST_ACCESS = "true";

    const response = await enableTestAccess(
      new Request("https://adminbtp.vercel.app/auth/test-access?next=%2Fadmin") as never,
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/admin");
    expect(response.cookies.get(getTestAccessCookieName())?.value).toBe("read_only_demo");
  });

  it("supprime le cookie a la sortie du mode test", async () => {
    const response = await disableTestAccess(
      new Request("https://adminbtp.vercel.app/auth/test-access/logout") as never,
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
  });
});
