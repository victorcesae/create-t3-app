import { betterAuth } from "better-auth";
import { createPool } from "mysql2/promise";

import { env } from "~/env";

export const auth = betterAuth({
  database: createPool(env.DATABASE_URL as string),
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
