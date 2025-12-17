import { neon } from "@netlify/neon";

async function ensureTablesExist(sql) {
  // Create admin_users table if not exists
  await sql`
    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      password_hash VARCHAR(255) NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Create sessions table if not exists
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      token VARCHAR(255) UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Check if admin user exists, create if not
  const existingUser = await sql`SELECT id FROM admin_users LIMIT 1`;
  if (existingUser.length === 0) {
    await sql`INSERT INTO admin_users (password_hash) VALUES ('adrianadmin')`;
  }
}

export default async (request) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const { password } = await request.json();

    if (!password) {
      return new Response(JSON.stringify({ success: false, message: "Hasło jest wymagane" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const sql = neon();

    // Ensure tables exist before querying
    await ensureTablesExist(sql);

    // Check if password matches in database
    const result = await sql`SELECT id FROM admin_users WHERE password_hash = ${password} AND is_active = true LIMIT 1`;

    if (result.length > 0) {
      // Generate a simple session token
      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store session in database
      await sql`INSERT INTO sessions (token, expires_at) VALUES (${sessionToken}, ${expiresAt})`;

      return new Response(JSON.stringify({
        success: true,
        token: sessionToken,
        message: "Zalogowano pomyślnie"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        message: "Nieprawidłowe hasło"
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "Błąd serwera"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const config = {
  path: "/api/login"
};
