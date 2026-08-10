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

    // --------------------------------------------------
    // HOME
    // --------------------------------------------------

    if (url.pathname === "/" && req.method === "GET") {
      response = new Response(
        "Hello from Mehran's Deno Lab! 🚀 VERSION 8",
      );

    // --------------------------------------------------
    // STATUS
    // --------------------------------------------------

    } else if (
      url.pathname === "/status" &&
      req.method === "GET"
    ) {
      response = Response.json({
        status: "online",
        platform: "Deno Deploy",
        version: "1.0",
      });

    // --------------------------------------------------
    // TIME
    // --------------------------------------------------

    } else if (
      url.pathname === "/time" &&
      req.method === "GET"
    ) {
      response = Response.json({
        serverTime: new Date().toISOString(),
      });

    // --------------------------------------------------
    // INFO
    // --------------------------------------------------

    } else if (
      url.pathname === "/info" &&
      req.method === "GET"
    ) {
      response = Response.json({
        method: req.method,
        url: req.url,
        userAgent: req.headers.get("user-agent"),
        timestamp: new Date().toISOString(),
      });

    // --------------------------------------------------
    // DATABASE TEST
    // --------------------------------------------------

    } else if (
      url.pathname === "/db-test" &&
      req.method === "GET"
    ) {
      const result = await pool.query(
        "SELECT 1 AS result",
      );

      response = Response.json({
        database: "connected",
        result: result.rows[0].result,
      });

    // --------------------------------------------------
    // DATABASE INITIALIZATION
    // --------------------------------------------------

    } else if (
      url.pathname === "/db-init" &&
      req.method === "GET"
    ) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      response = Response.json({
        database: "connected",
        table: "users",
        status: "created_or_exists",
      });

    // --------------------------------------------------
    // GET ALL USERS
    // --------------------------------------------------

    } else if (
      url.pathname === "/users" &&
      req.method === "GET"
    ) {
      const result = await pool.query(`
        SELECT
          id,
          name,
          email,
          created_at
        FROM users
        ORDER BY id ASC
      `);

      response = Response.json({
        count: result.rows.length,
        users: result.rows,
      });

    // --------------------------------------------------
    // CREATE USER
    // --------------------------------------------------

    } else if (
      url.pathname === "/users" &&
      req.method === "POST"
    ) {
      let body: {
        name?: string;
        email?: string;
      };

      try {
        body = await req.json();
      } catch {
        response = Response.json(
          {
            error: "Invalid JSON body",
          },
          { status: 400 },
        );

        return response;
      }

      const name = body.name?.trim();
      const email = body.email?.trim();

      if (!name || !email) {
        response = Response.json(
          {
            error: "name and email are required",
          },
          { status: 400 },
        );

        return response;
      }

      try {
        const result = await pool.query(
          `
          INSERT INTO users (name, email)
          VALUES ($1, $2)
          RETURNING id, name, email, created_at
          `,
          [name, email],
        );

        response = Response.json(
          result.rows[0],
          { status: 201 },
        );

      } catch (error) {
        console.error(
          "User creation failed:",
          error,
        );

        response = Response.json(
          {
            error: "Could not create user",
          },
          { status: 409 },
        );
      }

    // --------------------------------------------------
    // GET USER BY ID
    // --------------------------------------------------

    } else if (
      url.pathname.startsWith("/users/") &&
      req.method === "GET"
    ) {
      const id = url.pathname.split("/")[2];

      if (!id || !/^\d+$/.test(id)) {
        response = Response.json(
          {
            error: "Invalid user ID",
          },
          { status: 400 },
        );

      } else {
        const result = await pool.query(
          `
          SELECT
            id,
            name,
            email,
            created_at
          FROM users
          WHERE id = $1
          `,
          [Number(id)],
        );

        if (result.rows.length === 0) {
          response = Response.json(
            {
              error: "User not found",
            },
            { status: 404 },
          );
        } else {
          response = Response.json(
            result.rows[0],
          );
        }
      }

    // --------------------------------------------------
    // DELETE USER
    // --------------------------------------------------

    } else if (
      url.pathname.startsWith("/users/") &&
      req.method === "DELETE"
    ) {
      const id = url.pathname.split("/")[2];

      if (!id || !/^\d+$/.test(id)) {
        response = Response.json(
          {
            error: "Invalid user ID",
          },
          { status: 400 },
        );

      } else {
        const result = await pool.query(
          `
          DELETE FROM users
          WHERE id = $1
          RETURNING id, name, email
          `,
          [Number(id)],
        );

        if (result.rows.length === 0) {
          response = Response.json(
            {
              error: "User not found",
            },
            { status: 404 },
          );
        } else {
          response = Response.json({
            deleted: true,
            user: result.rows[0],
          });
        }
      }

    // --------------------------------------------------
    // TEST ERROR
    // --------------------------------------------------

    } else if (
      url.pathname === "/error" &&
      req.method === "GET"
    ) {
      throw new Error(
        "Test error from Mehran's Deno Lab",
      );

    // --------------------------------------------------
    // NOT FOUND
    // --------------------------------------------------

    } else {
      response = Response.json(
        {
          error: "Not Found",
          path: url.pathname,
          method: req.method,
        },
        { status: 404 },
      );
    }

    // --------------------------------------------------
    // RESPONSE LOG
    // --------------------------------------------------

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
