Deno.serve((req) => {
  const url = new URL(req.url);

  if (url.pathname === "/") {
    return new Response("Hello from Mehran's Deno Lab! 🚀 VERSION 2");
  }

  if (url.pathname === "/status") {
    return Response.json({
      status: "online",
      platform: "Deno Deploy",
      version: "1.0",
    });
  }

  if (url.pathname === "/time") {
    return Response.json({
      serverTime: new Date().toISOString(),
    });
  }

  return Response.json(
    {
      error: "Not Found",
      path: url.pathname,
    },
    { status: 404 },
  );
});
