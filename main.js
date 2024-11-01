const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

const audioprocess = require('./audio-processing')


// 系统配置
const config = {
  hostUrl: "wss://rtasr.xfyun.cn/v1/ws",
  appid: "944aa7dd",
  apiKey: "99e1e0eebdfdabedb761ee0e2f6e26c4",
  highWaterMark: 1280
}

// 鉴权签名
function getSigna(ts) {
  let md5 = CryptoJS.MD5(config.appid + ts).toString()
  let sha1 = CryptoJS.HmacSHA1(md5, config.apiKey)
  let base64 = CryptoJS.enc.Base64.stringify(sha1)
  return encodeURIComponent(base64)
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile('pages/index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 创建用于展示转换转态的新窗口
function createDisplayStatusWindow() {
  displayWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  displayWindow.loadFile('filetotext.html');

  displayWindow.on('closed', () => {
    displayWindow = null;
  });
}

// 处理选择文件的请求
ipcMain.handle('select-file', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Audio Files', extensions: ['wav', 'mp3', 'pcm'] }]
    });
  
    if (!canceled && filePaths.length > 0) {
      return filePaths[0];
    }
    return null;
  });



// 处理文件转文字的 WebSocket 请求
//require('./websocket.js');

ipcMain.handle('transcribe-file', async (event, filePath) => {
    //检查文件格式
    audioprocess.ConvertFormat(filePath);
    //return await startTranscription(filePath);
});


