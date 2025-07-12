
import { IModelService, StandaloneServices } from "@codingame/monaco-vscode-api";
import { ExtensionHostKind, IExtensionManifest, registerExtension } from "@codingame/monaco-vscode-api/extensions";
import { MenuId, MenuRegistry } from "@codingame/monaco-vscode-api/monaco";
import { type Uri } from "vscode";

const manifest: IExtensionManifest = {
  name: "defaults",
  publisher: "alightinastorm",
  version: "0.0.1",
  engines: {
    vscode: "*"
  },
};

const { getApi, setAsDefaultApi } = registerExtension(manifest, ExtensionHostKind.LocalProcess, { system: true });

let api: typeof import("vscode");

export async function activate() {

}
