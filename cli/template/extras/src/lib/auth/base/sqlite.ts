import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

import { env } from "~/env";

export const auth = betterAuth({
  database: new Database(env.DATABASE_URL),
  emailAndPassword: {
    enabled: false,
  },
  socialProviders: {
    discord: {
      clientId: env.DISCORD_CLIENT_ID as string,
      clientSecret: env.DISCORD_CLIENT_SECRET as string,
    },
  },
});
