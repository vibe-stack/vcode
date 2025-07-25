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
    name: "vcode-ide",
    executableName: process.platform === "linux" ? "vcode-ide" : "vcode IDE",
    appBundleId: "com.vibestack.vcode-ide",
    appCategoryType: "public.app-category.developer-tools",
    asar: {
      unpack: "{**/node-pty/**,**/better-sqlite3/**,**/faiss-node/**,**/onnxruntime-node/**,**/@xenova/**,**/sharp/**,**/@img/**,**/@huggingface/**,**/transformers/**,**/@mapbox/node-pre-gyp/**,**/bindings/**,**/nan/**,**/file-uri-to-path/**,**/semver/**,**/detect-libc/**,**/color/**,**/color-string/**,**/color-convert/**,**/color-name/**,**/simple-swizzle/**,**/.vite/**}",
    },
    ignore: [
      // Include only the native modules we need and exclude everything else from node_modules
      /^\/node_modules\/(?!(node-pty|better-sqlite3|faiss-node|onnxruntime-node|@xenova|sharp|@img|@huggingface|@mapbox\/node-pre-gyp|bindings|nan|file-uri-to-path|semver|detect-libc|color|color-string|color-convert|color-name|simple-swizzle|.vite)($|\/)).*/,
    ],
    osxUniversal: {
      x64ArchFiles: '*',
    },
    // Skip code signing for now
    // osxSign: process.env.CSC_LINK ? {} : undefined,
    // osxNotarize: process.env.APPLE_ID ? {
    //   appleId: process.env.APPLE_ID,
    //   appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    //   teamId: process.env.APPLE_TEAM_ID,
    // } : undefined,
  },
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "vibe-stack",
          name: "vcode"
        },
        prerelease: false,
        draft: false
      }
    }
  ],
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
    new MakerSquirrel({
      name: "vcode-ide",
      setupExe: "vcode-ide-setup.exe",
      setupIcon: "src/assets/imgs/icon.ico", // Add your icon
    }),
    new MakerZIP({}, ["darwin"]),
    new MakerRpm({
      options: {
        name: "vcode-ide",
        productName: "vcode IDE",
        genericName: "Code Editor",
        description: "A modern IDE for coding with a focus on vibe coding and productivity with grok.",
        categories: ["Development"],
        icon: "src/assets/imgs/icon.png", // Add your icon
      }
    }),
    new MakerDeb({
      options: {
        name: "vcode-ide",
        productName: "vcode IDE",
        genericName: "Code Editor",
        description: "A modern IDE for coding with a focus on vibe coding and productivity with grok.",
        categories: ["Development"],
        icon: "src/assets/imgs/icon.png", // Add your icon
      }
    }),
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
