const TEST_ACCESS_COOKIE_NAME = "adminbtp_test_access";
const TEST_ACCESS_COOKIE_VALUE = "read_only_demo";
const TEST_ACCESS_DURATION_SECONDS = 60 * 60 * 8;

export function getTestAccessCookieName() {
  return TEST_ACCESS_COOKIE_NAME;
}

export function getTestAccessCookieValue() {
  return TEST_ACCESS_COOKIE_VALUE;
}

export function getTestAccessCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TEST_ACCESS_DURATION_SECONDS,
  };
}

export function hasTestAccessCookieValue(value: string | undefined) {
  return value === TEST_ACCESS_COOKIE_VALUE;
}

export function isTestAccessEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_TEST_ACCESS !== "false";
}
