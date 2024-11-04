const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const audioprocess = require('./audio-processing')
const websocket = require('./websocket')
const recorder = require('node-record-lpcm16');
/*
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
*/

const options = {
  sampleRate: 16000, // 采样率16kHz
  channels: 1,        // 单声道
  bitDepth: 16,       // 位长16位
  recordProgram: "sox"
};

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

function createRecordWindow() {
  recordWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  recordWindow.loadFile('pages/record.html');
  recordWindow.on('closed', () => {
    recordWindow = null;
  });
}

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

  displayWindow.loadFile('pages/filetotext.html');
  displayWindow.on('closed', () => {
    displayWindow = null;
  });
}


// app.whenReady().then(createWindow);
app.whenReady().then(() => {
  createWindow();
});

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

// 开始录音
ipcMain.on('start-recording', () => {
  console.log('开始录音...');
  audioChunks = [];
  mic = recorder.record(options);
  
  mic.stream().on('data', (chunk) => {
      audioChunks.push(chunk);
    });
  mic.stream().on("error", (err) => {
    console.error("Error in Input Stream: " + err);
  });
  
  mic.stream().on("startComplete", () => {
    console.log("Microphone started.");
  });
  
  mic.stream().on("stopComplete", () => {
    console.log("Microphone stopped.");
  });
  mic.start();
});

// 停止录音并保存
ipcMain.on('stop-recording', async (event) => {
  console.log('停止录音...');
  if (mic) {
    mic.stop();
    mic = null;
  }

  // 选择保存路径
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: '保存录音',
    defaultPath: 'recording.pcm',
    filters: [{ name: 'PCM Audio', extensions: ['pcm'] }]
  });

  if (!canceled && filePath) {
    const buffer = Buffer.concat(audioChunks);
    fs.writeFile(filePath, buffer, (err) => {
      if (err) {
        console.error('无法保存录音文件:', err);
        event.reply('recording-saved', { success: false, message: err.message });
      } else {
        console.log('录音已保存到:', filePath);
        event.reply('recording-saved', { success: true, filePath });
      }
    });
  }
});



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


  // 处理保存路径选择
ipcMain.handle('select-save-path', async () => {
  const result = await dialog.showSaveDialog({
    title: '选择保存录音的路径',
    defaultPath: 'record.pcm',
    filters: [{ name: 'PCM Audio', extensions: ['pcm'] }]
  });

  return result.filePath;
});

// 处理保存录音文件的请求
ipcMain.handle('save-audio-file', async (event, audioBuffer) => {
  const { filePath } = await dialog.showSaveDialog({
    title: "保存录音文件",
    filters: [{ name: "Audio", extensions: ["pcm"] }]
  });

  if (filePath) {
    const save_buffer = Buffer.from(audioBuffer);
    fs.writeFileSync(filePath, save_buffer);
    return filePath;
  }
  return null;
});

// 处理文件转文字的 WebSocket 请求
//require('./websocket.js');

ipcMain.handle('transcribe-file', async (event, filePath) => {
    //检查文件格式
    audioprocess.convertFormat(filePath);
    websocket.startTranscription(filePath, (msg) => {
      if (mainWindow) {
        mainWindow.webContents.send('new-message', msg);
      }
    });

});


