import { neon } from "@netlify/neon";

export default async () => {
  const sql = neon();

  try {
    // Create admin_users table
    await sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        password_hash VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Check if admin user exists
    const existingUser = await sql`SELECT id FROM admin_users LIMIT 1`;

    if (existingUser.length === 0) {
      // Insert default admin password (user should change this!)
      await sql`INSERT INTO admin_users (password_hash) VALUES ('adrianadmin')`;
    }

    // Clean up expired sessions
    await sql`DELETE FROM sessions WHERE expires_at < NOW()`;

    return new Response(JSON.stringify({
      success: true,
      message: "Database initialized successfully"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Init error:", error);
    return new Response(JSON.stringify({
      success: false,
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const config = {
  path: "/api/init-db"
};
