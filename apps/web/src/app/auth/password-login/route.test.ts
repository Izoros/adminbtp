import { NextRequest, type NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({
  createRouteHandlerClient: vi.fn(),
  hasSupabaseConfig: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  hasSupabaseConfig: mocks.hasSupabaseConfig,
}));

vi.mock("@/lib/supabase/route-handler", async (importOriginal) => {
  const original = await importOriginal<
    typeof import("@/lib/supabase/route-handler")
  >();

  return {
    ...original,
    createRouteHandlerClient: mocks.createRouteHandlerClient,
  };
});

import { POST } from "@/app/auth/password-login/route";

function buildLoginRequest() {
  return new NextRequest("https://adminbtp.test/auth/password-login", {
    method: "POST",
    body: new URLSearchParams({
      email: "admin@fast976.yt",
      login_path: "/",
      next: "/admin",
      password: "mot-de-passe-test",
    }),
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
  });
}

describe("POST /auth/password-login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hasSupabaseConfig.mockReturnValue(true);
  });

  it("ecrit le cookie sur la reponse de redirection finale", async () => {
    let outgoingResponse: NextResponse | undefined;

    mocks.createRouteHandlerClient.mockImplementation((_, response) => {
      outgoingResponse = response;

      return {
        response,
        supabase: {
          auth: {
            signInWithPassword: vi.fn(async () => {
              response.cookies.set("sb-test-auth-token", "token", {
                path: "/",
                sameSite: "lax",
                secure: true,
              });

              return { error: null };
            }),
          },
        },
      };
    });

    const response = await POST(buildLoginRequest());

    expect(response).toBe(outgoingResponse);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("set-cookie")).toContain(
      "sb-test-auth-token=token",
    );
    expect(response.headers.get("set-cookie")).toContain("Secure");
    await expect(response.text()).resolves.toContain(
      "url=https://adminbtp.test/admin",
    );
  });

  it("signale une indisponibilite Supabase sans accuser le mot de passe", async () => {
    mocks.createRouteHandlerClient.mockImplementation((_, response) => ({
      response,
      supabase: {
        auth: {
          signInWithPassword: vi.fn(async () => ({
            error: {
              message: "fetch failed",
              name: "AuthRetryableFetchError",
              status: 0,
            },
          })),
        },
      },
    }));

    const response = await POST(buildLoginRequest());

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://adminbtp.test/?errorCode=authentication_unavailable",
    );
  });
});
