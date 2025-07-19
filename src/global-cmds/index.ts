import { app, globalShortcut } from "electron";

app.on('browser-window-focus', function () {
    globalShortcut.register("CommandOrControl+R", () => {
        // disabled
    });
    globalShortcut.register("F5", () => {
        // disabled
    });
});

app.on('browser-window-blur', function () {
    globalShortcut.unregister('CommandOrControl+R');
    globalShortcut.unregister('F5');
});
