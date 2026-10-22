import path from "node:path";
import type { HelperBinary } from "../../ports/platform.ts";

const HELPER_FILE_NAME = "ahoyHelper";

export function macosHelperBinary(projectRoot: string): HelperBinary {
  return {
    path: path.join(
      projectRoot,
      "native/macos-helper/.build/debug",
      HELPER_FILE_NAME,
    ),
    args: [],
  };
}

export function packagedHelperBinary(resourcesPath: string): HelperBinary {
  return { path: path.join(resourcesPath, HELPER_FILE_NAME), args: [] };
}
