
let seconds = 0;
let interval = null; // 计时器
let isRecording = false;
let pauseFlag = false;

// 返回按钮
document.getElementById('backBtn').addEventListener('click', () => {
    if (!isRecording) {
        window.location.href = './index.html';
    }
    else {
        alert('请先结束录音');
    }
});

// 开始录音
document.getElementById('startRecord').addEventListener('click', async () => {
    // 计时器清零
    if (interval !== null) {
        clearInterval(interval);
        interval = null;
    }
    document.getElementById('audioPlayback').src = null;
    window.electronAPI.startRecording();

    seconds = 0;
    document.getElementById('recordingTime').textContent = '00:00';
    // 计时器启动
    if (interval === null) {
        interval = setInterval(timer, 1000);
    }
    isRecording = true;
    document.getElementById('status').textContent = '录音中...';
    document.getElementById('startRecord').disabled = true;
    document.getElementById('stopRecord').disabled = false;
    document.getElementById('pauseRecord').disabled = false;
    //document.getElementById('audioPlayback').src = null;
});

// 暂停/继续录音
document.getElementById('pauseRecord').addEventListener('click', async() => {
    if(pauseFlag) { //暂停
        pauseFlag = false;
        window.electronAPI.pauseRecording();
        if (interval !== null) {
            clearInterval(interval);
            interval = null;
        }
        document.getElementById('pauseRecord').innerText = '继续';
        document.getElementById('status').textContent = '录音已暂停';
    }
    else { //继续
        pauseFlag = true;
        window.electronAPI.resumeRecording();
        if (interval === null) {
            interval = setInterval(timer, 1000);
        }
        document.getElementById('pauseRecord').innerText = '暂停';
        document.getElementById('status').textContent = '录音中...';
    }
    
});

// 结束录音
document.getElementById('stopRecord').addEventListener('click', () => {
    window.electronAPI.stopRecording();
    if (interval !== null) {
        clearInterval(interval);
        interval = null;
    }
    isRecording = false;
    document.getElementById('status').textContent = '录音结束';
    document.getElementById('startRecord').disabled = false;
    document.getElementById('stopRecord').disabled = true;
    document.getElementById('pauseRecord').disabled = true;
    document.getElementById('saveRecord').disabled = false;
});

// 保存为pcm
document.getElementById('saveRecord').addEventListener('click', () => {
    window.electronAPI.saveRecording();
});

window.electronAPI.onRecordingSaved((data) => {
    if (data.pcm) {
        const blob = new Blob(data.audio, { type: 'audio/wav' });
        const audioURL = URL.createObjectURL(blob);
        document.getElementById('audioPlayback').src = audioURL;
        document.getElementById('status').textContent = '录音已生成';
    }
    else if (data.success) {
        document.getElementById('status').textContent = '录音已保存为.pcm';
    }
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
function convertWavToPcm(arrayBuffer) {
    document.getElementById('status').textContent = '正在转换成pcm格式...';
    // 创建一个视图来读取 ArrayBuffer
    const view = new DataView(arrayBuffer);
    if (arrayBuffer.byteLength < 44) {
    throw new Error('无效 WAV file: header size is larger than the data.');
    }
    // 跳过 WAV 头部（44 字节）
    const offset = 44;
    // 读取采样数据
    const samples = [];
    for (let i = offset; i < arrayBuffer.byteLength; i += 2) {
    if (i + 1 >= arrayBuffer.byteLength) {
        break; // 或者抛出错误，取决于你的需求
    }
    // 读取 16-bit 样本
    const sample = view.getInt16(i, true /* little endian */);
    samples.push(sample / 0x8000); // 归一化到 [-1, 1]
    }
    return new Int16Array(samples).buffer;
}