import { Pool } from "npm:pg";

const pool = new Pool();

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  const url = new URL(req.url);

  console.log({
    type: "request",
    requestId,
    method: req.method,
    path: url.pathname,
    timestamp: new Date().toISOString(),
  });

  try {
    let response: Response;

    if (url.pathname === "/") {
      response = new Response(
        "Hello from Mehran's Deno Lab! 🚀 VERSION 6",
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
    } else if (url.pathname === "/secret") {
      const secret = Deno.env.get("LAB_SECRET");

      response = Response.json({
        configured: Boolean(secret),
        message: secret
          ? "Secret is configured"
          : "Secret is missing",
      });
    } else if (url.pathname === "/db-test") {
      try {
        const result = await pool.query(
          "SELECT 1 AS result",
        );

        response = Response.json({
          database: "connected",
          result: result.rows[0].result,
        });
      } catch (dbError) {
        console.error("Database query failed:", dbError);

        response = Response.json(
          {
            database: "error",
            message: "Database connection failed",
          },
          { status: 500 },
        );
      }
    } else if (url.pathname === "/error") {
      throw new Error(
        "Test error from Mehran's Deno Lab",
      );
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
      requestId,
      method: req.method,
      path: url.pathname,
      status: response.status,
      timestamp: new Date().toISOString(),
    });

    return response;
  } catch (error) {
    console.error({
      type: "error",
      requestId,
      method: req.method,
      path: url.pathname,
      error: error instanceof Error
        ? error.message
        : String(error),
      timestamp: new Date().toISOString(),
    });

    return Response.json(
      {
        error: "Internal Server Error",
        requestId,
      },
      { status: 500 },
    );
  }
});
