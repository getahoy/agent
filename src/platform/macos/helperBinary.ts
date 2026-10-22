import path from "node:path";

export type HelperBinary = {
  path: string;
  args: readonly string[];
};

export function macosHelperBinary(projectRoot: string): HelperBinary {
  return {
    path: path.join(projectRoot, "native/macos-helper/.build/debug/ahoyHelper"),
    args: [],
  };
}
