// Languages
import "@codingame/monaco-vscode-html-default-extension";
import "@codingame/monaco-vscode-css-default-extension";
import "@codingame/monaco-vscode-javascript-default-extension";
import "@codingame/monaco-vscode-typescript-basics-default-extension";
import "@codingame/monaco-vscode-json-default-extension";
import "@codingame/monaco-vscode-markdown-basics-default-extension";
import "@codingame/monaco-vscode-log-default-extension";

// Language servers
import "@codingame/monaco-vscode-html-language-features-default-extension";
import "@codingame/monaco-vscode-css-language-features-default-extension";
import "@codingame/monaco-vscode-typescript-language-features-default-extension";
import "@codingame/monaco-vscode-json-language-features-default-extension";
import "@codingame/monaco-vscode-markdown-language-features-default-extension";

import activateDefaults from "./activate-extensions";

export async function activateExtensions() {
    return Promise.all([
        activateDefaults()
    ])
}