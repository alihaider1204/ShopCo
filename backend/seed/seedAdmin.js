/**
 * Create or update an admin user from environment variables.
 *
 * Required in .env:
 *   ADMIN_EMAIL   — login email (typo alias: ADFMIN_EMAIL)
 *   ADMIN_PASS    — plain-text password (hashed by User model on save)
 *
 * Usage (from backend/):  npm run seed:admin
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";

dotenv.config();

const emailRaw =
  process.env.ADMIN_EMAIL?.trim() || process.env.ADFMIN_EMAIL?.trim();
const password = process.env.ADMIN_PASS?.trim();

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

async function main() {
  if (!emailRaw) {
    fail(
      "Missing ADMIN_EMAIL (or ADFMIN_EMAIL) in .env — set the admin login email."
    );
  }
  if (!password) {
    fail("Missing ADMIN_PASS in .env — set the admin password.");
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    fail("Missing MONGO_URI in .env");
  }

  const email = emailRaw.toLowerCase();

  await mongoose.connect(uri);

  const existing = await User.findOne({ email });

  if (existing) {
    existing.password = password;
    existing.isAdmin = true;
    existing.role = "admin";
    await existing.save();
    console.log(`Updated existing user to admin: ${email}`);
  } else {
    await User.create({
      firstName: "Admin",
      lastName: "User",
      email,
      password,
      isAdmin: true,
      role: "admin",
    });
    console.log(`Created admin user: ${email}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  const msg = err.message || String(err);
  const isSrvDns =
    err.code === "ECONNREFUSED" &&
    (err.syscall === "querySrv" || msg.includes("querySrv"));

  if (isSrvDns) {
    console.error(`
MongoDB connection failed at DNS (SRV lookup for Atlas).
Your PC could not resolve _mongodb._tcp.*.mongodb.net — this is usually network/DNS, not your password.

Try:
  • Internet / VPN: turn VPN off or on; disable strict firewall/antivirus for Node briefly.
  • Windows DNS: Settings → Network → DNS → use 8.8.8.8 and 8.8.4.4 (or 1.1.1.1), then retry.
  • Atlas: confirm the cluster is not Paused; Network Access allows your IP (0.0.0.0/0 for testing).
  • If SRV is blocked: In Atlas → Connect → choose the non-SRV "standard connection string"
    (mongodb://host1:27017,host2:27017,...) and set MONGO_URI to that instead of mongodb+srv://…
`);
  }
  console.error(msg);
  process.exit(1);
});

