import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { AutoUnpackNativesPlugin } from "@electron-forge/plugin-auto-unpack-natives";
import { FuseV1Options, FuseVersion } from "@electron/fuses";

const config: ForgeConfig = {
  packagerConfig: {
    asar: {
      unpack: "{**/node-pty/**,**/better-sqlite3/**,**/faiss-node/**,**/onnxruntime-node/**,**/@xenova/**,**/sharp/**,**/@img/**,**/@huggingface/**,**/transformers/**,**/@mapbox/node-pre-gyp/**,**/bindings/**,**/nan/**,**/file-uri-to-path/**,**/semver/**,**/detect-libc/**,**/color/**,**/color-string/**,**/color-convert/**,**/color-name/**,**/simple-swizzle/**}",
    },
    ignore: [
      // Include only the native modules we need and exclude everything else from node_modules
      /^\/node_modules\/(?!(node-pty|better-sqlite3|faiss-node|onnxruntime-node|@xenova|sharp|@img|@huggingface|@mapbox\/node-pre-gyp|bindings|nan|file-uri-to-path|semver|detect-libc|color|color-string|color-convert|color-name|simple-swizzle)($|\/)).*/,
    ],
    osxUniversal: {
      x64ArchFiles: '*',
    },
  },
  rebuildConfig: {
    extraModules: [
      "node-pty",
      "better-sqlite3",
      "faiss-node",
      "onnxruntime-node",
      "@xenova/transformers",
      "sharp"
    ],
  },
  makers: [
    new MakerSquirrel({}),
    new MakerZIP({}, ["darwin"]),
    new MakerRpm({}),
    new MakerDeb({}),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({

    }),
    new VitePlugin({
      build: [
        {
          entry: "src/main.ts",
          config: "vite.main.config.ts",
          target: "main",
        },
        {
          entry: "src/preload.ts",
          config: "vite.preload.config.ts",
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
      [FuseV1Options.OnlyLoadAppFromAsar]: false,
    }),
  ],
};

export default config;
