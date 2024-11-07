const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  //saveAudioFile: (audioBuffer) => ipcRenderer.invoke('save-audio-file', audioBuffer),
  selectFile: () => ipcRenderer.invoke('select-file'), //filetotext.html 中选择录音文件
  onNewMessage: (callback) => ipcRenderer.on('new-message', (event, msg) => callback(msg)), //filetotext.html 中实时接收数据
  saveTextToPDF: (text) => ipcRenderer.send('save-text-to-pdf', text), //main.js还未实现
  transcribeFile: (filePath) => ipcRenderer.invoke('transcribe-file', filePath),//filetotext.html 中将录音文件转为文字
  startRecording: () => ipcRenderer.send('start-recording'), //record.html 中开始录音
  stopRecording: () => ipcRenderer.send('stop-recording'), //record.html 中停止录音
  onRecordingSaved: (callback) => ipcRenderer.on('recording-saved', (event, data) => callback(data)), //record.html 中接收保存录音文件用于播放
  
  startRealtimeRecord: () => ipcRenderer.send('start-realtime-record'), //realtime-stt.html 中开始实时录音
  pauseRealtimeRecord: () => ipcRenderer.send('pause-realtime-record'), //realtime-stt.html 中暂停实时录音
  resumeRealtimeRecord: () => ipcRenderer.send('resume-realtime-record'), //realtime-stt.html 中继续实时录音
  stopRealtimeRecord: () => ipcRenderer.send('stop-realtime-record'), //realtime-stt.html 中停止实时录音
  onRealtimeTranscriptionResult: (callback) => ipcRenderer.on('realtime-transcription-result', (event, transcription) => callback(transcription)), //realtime-stt.html 中接收实时录音的结果
  onRealtimeStatusUpdate: (callback) => ipcRenderer.on('realtime-status-update', (event, status) => callback(status)), //realtime-stt.html 中接收实时录音状态更新
  onRealtimeRecordingSaved: (callback) => ipcRenderer.on('realtime-recording-saved', (event, data) => callback(data)) //realtime-stt.html 中接收保存录音文件用于播放
});