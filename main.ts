} else if (
  url.pathname.startsWith("/users/") &&
  req.method === "PATCH"
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

    if (!name && !email) {
      response = Response.json(
        {
          error: "At least one field is required",
        },
        { status: 400 },
      );
    } else {
      try {
        const result = await pool.query(
          `
          UPDATE users
          SET
            name = COALESCE($1, name),
            email = COALESCE($2, email)
          WHERE id = $3
          RETURNING id, name, email, created_at
          `,
          [
            name || null,
            email || null,
            Number(id),
          ],
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
      } catch (error) {
        console.error(
          "User update failed:",
          error,
        );

        response = Response.json(
          {
            error: "Could not update user",
          },
          { status: 409 },
        );
      }
    }
