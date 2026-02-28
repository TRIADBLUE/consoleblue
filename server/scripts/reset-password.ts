#!/usr/bin/env npx tsx
/**
 * Reset an admin user's password.
 *
 * Usage:
 *   npx tsx server/scripts/reset-password.ts <email> <new-password>
 *
 * Example:
 *   npx tsx server/scripts/reset-password.ts admin@example.com myNewPass123
 */

import * as bcrypt from "bcryptjs";
import pg from "pg";

async function main() {
  const [email, newPassword] = process.argv.slice(2);

  if (!email || !newPassword) {
    console.error("Usage: npx tsx server/scripts/reset-password.ts <email> <new-password>");
    process.exit(1);
  }

  if (newPassword.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is not set.");
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    // Check user exists
    const { rows } = await client.query(
      "SELECT id, email, display_name FROM admin_users WHERE LOWER(email) = LOWER($1)",
      [email],
    );

    if (rows.length === 0) {
      console.error(`No admin user found with email: ${email}`);
      process.exit(1);
    }

    const user = rows[0];

    // Hash and update
    const hash = await bcrypt.hash(newPassword, 12);
    await client.query(
      "UPDATE admin_users SET password_hash = $1, failed_login_attempts = 0, account_locked = false, locked_until = NULL WHERE id = $2",
      [hash, user.id],
    );

    console.log(`Password reset for ${user.display_name || user.email} (id: ${user.id})`);
    console.log("Account unlocked and failed login attempts cleared.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
