const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveAudioFile: (audioBuffer) => ipcRenderer.invoke('save-audio-file', audioBuffer),
  selectFile: () => ipcRenderer.invoke('select-file'),
  saveTextFile: (text) => ipcRenderer.invoke('save-text', text),
  transcribeFile: (filePath) => ipcRenderer.invoke('transcribe-file', filePath),

  startRecording: () => ipcRenderer.send('start-recording'),
  stopRecording: () => ipcRenderer.send('stop-recording'),
  onRecordingSaved: (callback) => ipcRenderer.on('recording-saved', callback),

  onNewMessage: (callback) => ipcRenderer.on('new-message', (event, msg) => callback(msg)),
  saveMessages: async (messages) => await ipcRenderer.invoke('save-messages', messages)
});