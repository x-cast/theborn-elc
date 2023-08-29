const {
    contextBridge,
    ipcRenderer
} = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    "api", {
    send: (channel, data) => {
        let validChannels = ["setting"];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, JSON.stringify(data));
        }
    },
    receive: (channel, func) => {
        let validChannels = ["main"];
        if (validChannels.includes(channel)) {
            // Deliberately strip event as it includes `sender` 
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    }
}
);