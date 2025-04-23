import path from "path";
import fs from "fs-extra";

import { PKG_ROOT } from "~/consts.js";
import { type AvailableDependencies } from "~/installers/dependencyVersionMap.js";
import { type Installer } from "~/installers/index.js";
import { addPackageDependency } from "~/utils/addPackageDependency.js";

export const betterAuthInstaller: Installer = ({
  projectDir,
  packages,
  databaseProvider,
}) => {
  const usingPrisma = packages?.prisma.inUse;
  const usingDrizzle = packages?.drizzle.inUse;

  const deps: AvailableDependencies[] = ["better-auth"];
  if (!usingPrisma && !usingDrizzle) {
    switch (databaseProvider) {
      case "mysql":
        deps.push("mysql2");
        break;
      case "sqlite":
        deps.push("better-sqlite3");
        break;
      case "postgres":
        deps.push("pg");
        break;

      default:
        break;
    }
  }

  addPackageDependency({
    projectDir,
    dependencies: deps,
    devMode: false,
  });

  const extrasDir = path.join(PKG_ROOT, "template/extras");
  const apiHandlerFile = "src/app/api/auth/[...all]/route.ts";

  const apiHandlerSrc = path.join(extrasDir, apiHandlerFile);
  const apiHandlerDest = path.join(projectDir, apiHandlerFile);

  const authIndexSrc = path.join(
    extrasDir,
    "src/lib/auth",
    usingPrisma
      ? "with-prisma.ts"
      : usingDrizzle
        ? "with-drizzle.ts"
        : `base/${databaseProvider}.ts`
  );

  if (usingDrizzle || usingPrisma) {
    let fileContent = fs.readFileSync(authIndexSrc, "utf-8");
    const correctProviderName =
      databaseProvider === "postgres"
        ? usingDrizzle
          ? "pg"
          : "postgresql"
        : databaseProvider;

    fileContent = fileContent.replace(
      /DATABASE_PROVIDER/g,
      correctProviderName
    );

    fs.writeFileSync(authIndexSrc, fileContent, "utf-8");
  }

  const authIndexDest = path.join(projectDir, "src/lib/auth.ts");

  const authClientSrc = path.join(extrasDir, "src/lib/auth-client.ts");
  const authClientDest = path.join(projectDir, "src/lib/auth-client.ts");

  fs.copySync(apiHandlerSrc, apiHandlerDest);
  fs.copySync(authIndexSrc, authIndexDest);
  fs.copySync(authClientSrc, authClientDest);
};
