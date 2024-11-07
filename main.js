const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const audioprocess = require('./audio-processing')
const websocket = require('./websocket')
const recorder = require('node-record-lpcm16');

const options = {
  sampleRate: 16000, // 采样率16kHz
  channels: 1,        // 单声道
  bitDepth: 16,       // 位长16位
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


// record.html 开始录音
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


// record.html 停止录音并保存
ipcMain.on('stop-recording', async (event) => {
  console.log('停止录音...');

  if (mic) {
    mic.stop();
    // 监听 'close' 事件，确保录音进程已完全停止
    mic.stream().on('close', async () => {
      console.log('录音进程已关闭');
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
            event.reply('recording-saved', { success: true, filePath: filePath, audio: audioChunks });
          }
        });
      }
    });

    // 清空录音对象
    mic = null;
  }
});



//filetotext.html 中选择录音文件
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



//filetotext.html 中将录音文件转为文字
ipcMain.handle('transcribe-file', async (event, filePath) => {
    //检查文件格式
    audioprocess.convertFormat(filePath);
    websocket.startTranscription(filePath, (msg) => {
      if (mainWindow) {
        mainWindow.webContents.send('new-message', msg);
      }
    });

});

//filetotext.html 中将录音文字保存为PDF
ipcMain.on('save-text-to-pdf', async (event, text) => {
  // 弹出保存对话框，让用户选择保存路径
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: '保存为 PDF',
    defaultPath: 'output.pdf',
    filters: [{ name: 'PDF 文件', extensions: ['pdf'] }]
  });

  if (!canceled && filePath) {
    const printWindow = new BrowserWindow({
      show: false, // 不显示窗口
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      }
    });
    // 创建一个 HTML 页面，包裹字符串
    const htmlContent = `
      <html>
      <body>
        <h1>语音转文字结果</h1>
        <p>${text}</p>
      </body>
      </html>
    `;
    
    // 加载HTML内容到临时窗口
    printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));

    printWindow.webContents.on('did-finish-load', () => {
      // 将页面内容保存为 PDF
      printWindow.webContents.printToPDF({}).then((data) => {
        fs.writeFile(filePath, data, (err) => {
          if (err) {
            console.error('无法保存 PDF 文件:', err);
          } else {
            console.log('PDF 已保存到:', filePath);
          }
        });
      }).catch((error) => {
        console.error('生成 PDF 时出错:', error);
      });
    });
  }
});


//realtime-stt.html 中开始实时录音
ipcMain.on('start-realtime-record', (event) => {
  console.log('startRealtimeRecording...');
  websocket.startRealtimeRecording(event);
});

//realtime-stt.html 中暂停实时录音
ipcMain.on('pause-realtime-record', (event) => {
  websocket.pauseRealtimeRecording(event);
});

//realtime-stt.html 中继续实时录音
ipcMain.on('resume-realtime-record', (event) => {
  websocket.resumeRealtimeRecording(event);
});

//realtime-stt.html 中停止实时录音
ipcMain.on('stop-realtime-record', (event) => {
  const audioChunks = websocket.stopRealtimeRecording(event);
  event.reply('realtime-recording-saved', audioChunks);
});



