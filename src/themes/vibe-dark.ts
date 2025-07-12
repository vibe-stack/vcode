import { IExtensionManifest } from "@codingame/monaco-vscode-api/vscode/vs/platform/extensions/common/extensions";
import { ExtensionHostKind } from "@codingame/monaco-vscode-extensions-service-override";
import { registerExtension } from '@codingame/monaco-vscode-api/extensions'

const manifest: IExtensionManifest = {
  name: "vibe-dark",
  version: "0.0.1",
  publisher: "alightinastorm",
  engines: {
    vscode: "*"
  },
  contributes: {
    themes: [
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore id type problem
      {
        label: "Vibe Dark",
        path: "/vibe-dark.json",
        uiTheme: "vs-dark"
      }
    ]
  }
};

const { registerFileUrl } = registerExtension(manifest, ExtensionHostKind.LocalProcess);
const fileURL = new URL("./vibe-dark.json", import.meta.url).toString();
registerFileUrl("/vibe-dark.json", fileURL);
console.log("registered vibe-dark theme with Monaco VSCode API", fileURL);