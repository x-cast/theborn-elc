const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron')
const path = require("path");
const DB = require("./modules/db.js");
const update = require("./modules/update.js");

let db = null, resetInterval = null, resetCount = 0
let updateWin = null
const createWindow = (datas) => {
    const win = new BrowserWindow({
        alwaysOnTop: true,
        fullscreen: true,
        webPreferences: {
            devTools: false,
            nodeIntegration: false, // is default value after Electron v5
            contextIsolation: true, // protect against prototype pollution
            enableRemoteModule: false, // turn off remote
            preload: path.join(__dirname, "preload.js") // use a preload script
        }
    })
    win.webContents.on('did-finish-load', (evt) => {
        win.webContents.send('main', JSON.stringify(datas))
    })
    win.loadFile(path.join(__dirname, 'index.html'))
}

const createSettingWindow = () => {
    const win = new BrowserWindow({
        alwaysOnTop: true,
        resizable: false,
        frame: false,
        height: 600,
        width: 800,
        webPreferences: {
            nodeIntegration: false, // is default value after Electron v5
            contextIsolation: true, // protect against prototype pollution
            enableRemoteModule: false, // turn off remote
            preload: path.join(__dirname, "preload.js") // use a preload script
        }
    })
    win.loadFile(path.join(__dirname, 'setting-index.html'))
    ipcMain.on('setting', (channel, data) => {
        const dt = JSON.parse(data)
        Object.keys(dt).forEach(key => {
            db.saveData(key, dt[key])
        })
        win.destroy()
        checkToData()
    })
}

function createDefaultUpdateWindow() {
    updateWin = new BrowserWindow(
        {
            backgroundColor: "#eeeeee",
            webPreferences: { nodeIntegration: true },
        }
    );
    updateWin.on("closed", () => {
        updateWin = null;
    })
    // updateWin.loadURL(`file://${__dirname}/version.html#v${app.getVersion()}`);
    win.loadFile(path.join(__dirname, 'loading.html'))
    return updateWin;
}

app.whenReady().then(() => {
    const autoUpdater = new update({
        needUpdate: () => {
            createDefaultUpdateWindow()
        },
        noUpdate: () => {
            checkToData()
        }
    }, isDev())
    autoUpdater.checkForUpdates();
})

app.on('window-all-closed', () => {
    app.quit();
});
app.on('browser-window-focus', function () {
    globalShortcut.register("CommandOrControl+R", () => {
        console.log("Refresh disable");
    });
    globalShortcut.register("F5", () => {
        console.log("Refresh disable");
    });
    globalShortcut.register("`", () => {
        resetCount++
        if (resetInterval == null) resetInterval = setTimeout(() => { resetInterval = null, resetCount = 0 }, 2000)
        if (resetCount >= 5) {
            db.deleteData("id")
            db.deleteData("name")
            db.deleteData("admin")
            app.quit()
        }
    })
});
app.on('browser-window-blur', function () {
    globalShortcut.unregister('CommandOrControl+R');
    globalShortcut.unregister('F5');
    globalShortcut.unregister('`');
});

function checkToData() {
    db = new DB()
    const id = db.getData("id")
    if (id == null)
        return createSettingWindow()

    const name = db.getData("name")
    const admin = db.getData("admin")
    console.log(id, name, admin)
    createWindow({ id, name, admin })
}

function isDev() {
    return !app.isPackaged;
};