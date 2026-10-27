import { execFileSync } from "node:child_process";
import { FuseV1Options, FuseVersion } from "@electron/fuses";
import { MakerDMG } from "@electron-forge/maker-dmg";
import { MakerZIP } from "@electron-forge/maker-zip";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { VitePlugin } from "@electron-forge/plugin-vite";
import type { ForgeConfig } from "@electron-forge/shared-types";

const HELPER_PACKAGE = "native/macos-helper";

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    appBundleId: "com.getahoy.agent",
    extendInfo: {
      LSUIElement: true,
      LSAppNapIsDisabled: true,
      NSAppleEventsUsageDescription:
        "Ahoy controls apps you name, like quitting or hiding them, when you ask from your phone.",
    },
    extraResource: [`${HELPER_PACKAGE}/.build/release/ahoyHelper`],
    osxSign: { type: "development", identity: "Apple Development" },
  },
  hooks: {
    prePackage: async () => {
      execFileSync(
        "swift",
        ["build", "-c", "release", "--package-path", HELPER_PACKAGE],
        { stdio: "inherit" },
      );
    },
  },
  rebuildConfig: {},
  makers: [new MakerDMG({}), new MakerZIP({}, ["darwin"])],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: "src/main.ts",
          config: "vite.main.config.mts",
          target: "main",
        },
        {
          entry: "src/preload.ts",
          config: "vite.preload.config.mts",
          target: "preload",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.mts",
        },
      ],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
