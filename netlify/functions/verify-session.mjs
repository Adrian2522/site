import { neon } from "@netlify/neon";

export default async (request) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const { token } = await request.json();

    if (!token) {
      return new Response(JSON.stringify({ valid: false }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const sql = neon();

    // Check if token exists and is not expired
    const result = await sql`SELECT id FROM sessions WHERE token = ${token} AND expires_at > NOW() LIMIT 1`;

    return new Response(JSON.stringify({
      valid: result.length > 0
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Session verification error:", error);
    return new Response(JSON.stringify({ valid: false }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const config = {
  path: "/api/verify-session"
};
