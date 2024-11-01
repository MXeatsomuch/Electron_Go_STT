const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: () => ipcRenderer.invoke('select-file'),
  saveTextFile: (text) => ipcRenderer.invoke('save-text', text),
  transcribeFile: (filePath) => ipcRenderer.invoke('transcribe-file', filePath)
});