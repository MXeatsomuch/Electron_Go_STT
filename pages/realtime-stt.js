    let seconds = 0;
    let interval = null; // 计时器
    let transcriptionText = ''; // 转录文本
    let pauseFlag = true; // 暂停标志
    let isRecording = false; // 录音标志

    //返回事件
    document.getElementById('backBtn').addEventListener('click', () => {
        if (!isRecording) {
            window.location.href = './index.html';
        }
        else {
            alert('请先结束录音');
        }
    });

    // 开始录音
    document.getElementById('startBtn').addEventListener('click', () => {
        // 计时器清零
        if (interval !== null) {
            clearInterval(interval);
            interval = null;
        }
        seconds = 0;
        document.getElementById('recordingTime').textContent = '00:00';

        // 录音播放清零
        transcriptionText = ''; // 每次录音清空转录文本
        document.getElementById('inputText').value = '';
        document.getElementById('audioPlayback').src = null;

        // 连接并开始录音
        window.electronAPI.startRealtimeRecord();

        // 计时器启动
        if (interval === null) {
            interval = setInterval(timer, 1000);
        }

        isRecording = true;

        document.getElementById('pauseBtn').disabled = false;
        document.getElementById('stopBtn').disabled = false;
        document.getElementById('startBtn').disabled = true;
    });

    // 暂停/继续录音
    document.getElementById('pauseBtn').addEventListener('click', () => {
        if(pauseFlag) { //暂停
            pauseFlag = false;
            window.electronAPI.pauseRealtimeRecord();
            if (interval !== null) {
                clearInterval(interval);
                interval = null;
            }
            document.getElementById('pauseBtn').innerText = '继续';
        }
        else { //继续
            pauseFlag = true;
            window.electronAPI.resumeRealtimeRecord();
            if (interval === null) {
                interval = setInterval(timer, 1000);
            }
            document.getElementById('pauseBtn').innerText = '暂停';
        }
        
    });

    // 结束录音
    document.getElementById('stopBtn').addEventListener('click', function() {
        // 结束录音
        window.electronAPI.stopRealtimeRecord();
        // 删除计时器
        if (interval !== null) {
            clearInterval(interval);
            interval = null;
        }

        isRecording = false;

        document.getElementById('startBtn').disabled = false;
        document.getElementById('saveBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('stopBtn').disabled = true;

    });

    // 保存
    document.getElementById('saveBtn').addEventListener('click', () => {
         
        // 保存转录文本到PDF
        const saveFlag = window.electronAPI.saveTextToPDF(document.getElementById('inputText').value);
        document.getElementById('statusDisplay').textContent = `文本保存成功`;
        if (saveFlag) {
            document.getElementById('statusDisplay').textContent = `文本保存成功`;
        }
    });

    // 实时转录结果展示
    window.electronAPI.onRealtimeTranscriptionResult((transcription) => {
        transcriptionText += transcription; // 累积转录结果
        document.getElementById('inputText').value = transcriptionText; // 实时展示
    });

    // 实时更新状态信息
    window.electronAPI.onRealtimeStatusUpdate((status) => {
        document.getElementById('statusDisplay').textContent = status;
    });

    // 前端播放录音
    window.electronAPI.onRealtimeRecordingSaved((data) => {
        const blob = new Blob(data, { type: 'audio/wav' });
        const audioURL = URL.createObjectURL(blob);
        document.getElementById('audioPlayback').src = audioURL;
    });

    function timer() {
      seconds++;
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;

      document.getElementById('recordingTime').textContent =
          `${pad(minutes)}:${pad(secs)}`;

      function pad(value) {
          return String(value).padStart(2, '0');
      }
  }