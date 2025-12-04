import { useState, useEffect } from "react";
import packageJson from "../../package.json";

type PackageManager = "bun" | "npm" | "yarn" | "pnpm";

interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  packageManager: PackageManager;
}

interface NpmPackageResponse {
  version: string;
}

/**
 * Detects which package manager was used to install the package.
 * Checks the executable path for package manager-specific directories.
 */
function detectPackageManager(): PackageManager {
  const execPath = process.argv[1] || "";
  if (execPath.includes(".bun")) {
    return "bun";
  }
  if (execPath.includes(".yarn") || execPath.includes("/yarn/")) {
    return "yarn";
  }
  if (execPath.includes(".pnpm") || execPath.includes("/pnpm/")) {
    return "pnpm";
  }
  return "npm";
}

/**
 * Checks for updates by comparing the current version against the latest on NPM.
 * Returns update info if a newer version is available.
 */
export function useUpdateChecker(): UpdateInfo | null {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

  useEffect(() => {
    async function checkForUpdate() {
      try {
        const response = await fetch(
          `https://registry.npmjs.org/${packageJson.name}/latest`
        );
        if (!response.ok) return;

        const data = (await response.json()) as NpmPackageResponse;
        const latestVersion = data.version;
        const currentVersion = packageJson.version;

        if (latestVersion !== currentVersion) {
          setUpdateInfo({
            currentVersion,
            latestVersion,
            hasUpdate: true,
            packageManager: detectPackageManager(),
          });
        }
      } catch {
        // Silently fail - update check is not critical
      }
    }

    checkForUpdate();
  }, []);

  return updateInfo;
}
