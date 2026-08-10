Deno.serve((req) => {
  const url = new URL(req.url);

  console.log({
    type: "request",
    method: req.method,
    path: url.pathname,
    timestamp: new Date().toISOString(),
  });

  let response: Response;

  if (url.pathname === "/") {
    response = new Response(
      "Hello from Mehran's Deno Lab! 🚀 VERSION 2",
    );
  } else if (url.pathname === "/status") {
    response = Response.json({
      status: "online",
      platform: "Deno Deploy",
      version: "1.0",
    });
  } else if (url.pathname === "/time") {
    response = Response.json({
      serverTime: new Date().toISOString(),
    });
  } else if (url.pathname === "/info") {
    response = Response.json({
      method: req.method,
      url: req.url,
      userAgent: req.headers.get("user-agent"),
      timestamp: new Date().toISOString(),
    });
  } else {
    response = Response.json(
      {
        error: "Not Found",
        path: url.pathname,
      },
      { status: 404 },
    );
  }

  console.log({
    type: "response",
    method: req.method,
    path: url.pathname,
    status: response.status,
    timestamp: new Date().toISOString(),
  });

  return response;
});
