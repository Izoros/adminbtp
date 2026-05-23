export async function GET() {
  return Response.json({
    status: "ok",
    service: "adminbtp-web",
    timestamp: new Date().toISOString(),
  });
}
