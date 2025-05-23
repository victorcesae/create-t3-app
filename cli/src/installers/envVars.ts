import crypto from "node:crypto";
import path from "path";
import fs from "fs-extra";

import { PKG_ROOT } from "~/consts.js";
import { type DatabaseProvider, type Installer } from "~/installers/index.js";

export const envVariablesInstaller: Installer = ({
  projectDir,
  packages,
  databaseProvider,
  scopedAppName,
}) => {
  const usingBetterAuth = packages?.betterAuth.inUse;
  const usingAuth = packages?.nextAuth.inUse;
  const usingPrisma = packages?.prisma.inUse;
  const usingDrizzle = packages?.drizzle.inUse;

  const usingDb = usingPrisma === true || usingDrizzle === true;
  const usingPlanetScale = databaseProvider === "planetscale";

  const envContent = getEnvContent(
    !!usingAuth,
    !!usingBetterAuth,
    !!usingPrisma,
    !!usingDrizzle,
    databaseProvider,
    scopedAppName
  );

  let envFile = "";
  if (usingDb) {
    if (usingPlanetScale) {
      if (usingAuth) envFile = "with-auth-db-planetscale.js";
      else envFile = "with-db-planetscale.js";
    } else {
      if (usingAuth) {
        envFile = "with-auth-db.js";
      } else if (usingBetterAuth) {
        envFile = "with-better-auth.js";
      } else envFile = "with-db.js";
    }
  } else {
    if (usingAuth) {
      envFile = "with-auth.js";
    } else if (usingBetterAuth) {
      envFile = "with-better-auth-db.js";
    }
  }

  if (envFile !== "") {
    const envSchemaSrc = path.join(
      PKG_ROOT,
      "template/extras/src/env",
      envFile
    );
    const envSchemaDest = path.join(projectDir, "src/env.js");
    fs.copyFileSync(envSchemaSrc, envSchemaDest);
  }

  const envDest = path.join(projectDir, ".env");
  const envExampleDest = path.join(projectDir, ".env.example");

  const _exampleEnvContent = exampleEnvContent + envContent;

  // Generate an auth secret and put in .env, not .env.example
  const secret = Buffer.from(
    crypto.getRandomValues(new Uint8Array(32))
  ).toString("base64");
  const authSecretName = usingAuth ? "AUTH_SECRET" : "BETTER_AUTH_SECRET";
  const _envContent = envContent.replace(
    `${authSecretName}=""`,
    `${authSecretName}="${secret}" # Generated by create-t3-app.`
  );

  fs.writeFileSync(envDest, _envContent, "utf-8");
  fs.writeFileSync(envExampleDest, _exampleEnvContent, "utf-8");
};

const getEnvContent = (
  usingAuth: boolean,
  usingBetterAuth: boolean,
  usingPrisma: boolean,
  usingDrizzle: boolean,
  databaseProvider: DatabaseProvider,
  scopedAppName: string
) => {
  let content = `
# When adding additional environment variables, the schema in "/src/env.js"
# should be updated accordingly.
`
    .trim()
    .concat("\n");

  if (usingAuth)
    content += `
# Next Auth
# You can generate a new secret on the command line with:
# npx auth secret
# https://next-auth.js.org/configuration/options#secret
AUTH_SECRET=""

# Next Auth Discord Provider
AUTH_DISCORD_ID=""
AUTH_DISCORD_SECRET=""
`;

  if (usingPrisma)
    content += `
# Prisma
# https://www.prisma.io/docs/reference/database-reference/connection-urls#env
`;

  if (usingDrizzle) content += "\n# Drizzle\n";

  if (usingPrisma || usingDrizzle) {
    if (databaseProvider === "planetscale") {
      if (usingDrizzle) {
        content += `# Get the Database URL from the "prisma" dropdown selector in PlanetScale. 
# Change the query params at the end of the URL to "?ssl={"rejectUnauthorized":true}"
DATABASE_URL='mysql://YOUR_MYSQL_URL_HERE?ssl={"rejectUnauthorized":true}'`;
      } else {
        content = `# Get the Database URL from the "prisma" dropdown selector in PlanetScale. 
DATABASE_URL='mysql://YOUR_MYSQL_URL_HERE?sslaccept=strict'`;
      }
    } else if (databaseProvider === "mysql") {
      content += `DATABASE_URL="mysql://root:password@localhost:3306/${scopedAppName}"`;
    } else if (databaseProvider === "postgres") {
      content += `DATABASE_URL="postgresql://postgres:password@localhost:5432/${scopedAppName}"`;
    } else if (databaseProvider === "sqlite") {
      content += 'DATABASE_URL="file:./db.sqlite"';
    }
    content += "\n";
  }

  if (usingBetterAuth)
    content += `
# Better Auth
# You can generate a new secret on the command line with:
# npx auth secret
BETTER_AUTH_SECRET=""
BASE_URL="http://localhost:3000"
# Better Auth Discord Provider
DISCORD_CLIENT_ID=""
DISCORD_CLIENT_SECRET=""
`;

  if (!usingAuth && !usingPrisma)
    content += `
# Example:
# SERVERVAR="foo"
# NEXT_PUBLIC_CLIENTVAR="bar"
`;

  return content;
};

const exampleEnvContent = `
# Since the ".env" file is gitignored, you can use the ".env.example" file to
# build a new ".env" file when you clone the repo. Keep this file up-to-date
# when you add new variables to \`.env\`.

# This file will be committed to version control, so make sure not to have any
# secrets in it. If you are cloning this repo, create a copy of this file named
# ".env" and populate it with your secrets.
`
  .trim()
  .concat("\n\n");
