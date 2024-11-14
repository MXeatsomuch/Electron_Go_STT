let seconds = 0;
let interval = null; // 计时器
let pauseFlag = true; // 暂停标志
let isRecording = false; // 录音标志
let transcriptionText = ''; // 用于保存pdf
let lastMessageBlock = null; // 用于保存当前对话区块
let lastRole = null; // 用于保存上一个角色编号
let roleColors = { // 用于保存角色颜色
    '1': 'rgba(255, 215, 0, 0.8)', // 金色，80% 透明度
    '2': 'rgba(255, 160, 122, 0.8)', // 淡珊瑚色，80% 透明度
    '3': 'rgba(173, 216, 230, 0.8)', // 浅蓝色，80% 透明度
    '4': 'rgba(255, 192, 203, 0.8)', // 淡粉色，80% 透明度
    '5': 'rgba(152, 251, 152, 0.8)', // 淡绿色，80% 透明度
    '6': 'rgba(240, 230, 140, 0.8)', // 浅黄色，80% 透明度
    '7': 'rgba(230, 230, 250, 0.8)', // 淡紫色，80% 透明度
    '8': 'rgba(250, 240, 230, 0.8)', // 象牙白，80% 透明度
    '9': 'rgba(255, 105, 180, 0.8)', // 深浅粉红，80% 透明度
    '10': 'rgba(135, 206, 250, 0.8)', // 天蓝色，80% 透明度
 }; 
const chatBox = document.getElementById('chat-box-rt');
 
//根据角色编号获取颜色
function getRoleColor(role) {
    return roleColors[role % 10 + 1];
}
//清空聊天框
function clearChatBox() {
    chatBox.innerHTML = '';
    lastMessageBlock = null;
    lastRole = null;
    transcriptionText = '';
    document.getElementById('saveBtn').disabled = true;
}



//返回事件
document.getElementById('backBtn').addEventListener('click', () => {
    if (!isRecording) {
        clearChatBox();
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
    document.getElementById('audioPlayback').src = null;
    clearChatBox();

    // 连接并开始录音
    window.electronAPI.startRealtimeRecord();

    // 计时器启动
    if (interval === null) {
        interval = setInterval(timer, 1000);
    }

    isRecording = true;
    pauseFlag = true;
    document.getElementById('pauseBtn').innerText = '暂停';
    document.getElementById('pauseBtn').disabled = false;
    document.getElementById('stopBtn').disabled = false;
    document.getElementById('startBtn').disabled = true;
    document.getElementById('statusDisplay').textContent = '正在录音...';
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
        document.getElementById('statusDisplay').textContent = '录音已暂停';
    }
    else { //继续
        pauseFlag = true;
        window.electronAPI.resumeRealtimeRecord();
        if (interval === null) {
            interval = setInterval(timer, 1000);
        }
        document.getElementById('pauseBtn').innerText = '暂停';
        document.getElementById('statusDisplay').textContent = '录音已继续';
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
    document.getElementById('statusDisplay').textContent = '录音已结束';
});

// 保存
document.getElementById('saveBtn').addEventListener('click', () => {
    // 保存转录文本到PDF
    const saveFlag = window.electronAPI.saveTextToPDF(transcriptionText);
    if (saveFlag) {
        document.getElementById('statusDisplay').textContent = `文本保存成功`;
    }
    else {
        document.getElementById('statusDisplay').textContent = `文本保存失败`;
    }
});

// 实时转录结果展示
window.electronAPI.onRealtimeTranscriptionResult((message) => {
    if (message.type === 'success') {
        if (message.role !== lastRole) {
            // 创建新对话区块
            lastMessageBlock = document.createElement('div');
            lastMessageBlock.classList.add('message-block');

            // 创建角色标题
            const roleHeader = document.createElement('div');
            roleHeader.classList.add('role-header');
            roleHeader.textContent = `角色 ${message.role}:`;

            // 创建气泡
            const messageBubble = document.createElement('div');
            messageBubble.classList.add('message-bubble');
            messageBubble.textContent = message.text;

            // 设置气泡的背景颜色
            messageBubble.style.backgroundColor = getRoleColor(message.role);

            // 添加到对话区块
            lastMessageBlock.appendChild(roleHeader);
            lastMessageBlock.appendChild(messageBubble);

            // 添加到聊天框
            chatBox.appendChild(lastMessageBlock);

            if(transcriptionText != '') {
                transcriptionText += '<br>';
            }
            transcriptionText += `角色${message.role}：`;
            lastRole = message.role;
        }
        else {
            // 如果角色没有变，直接追加到当前的对话区块
            const messageBubble = lastMessageBlock.querySelector('.message-bubble');
            messageBubble.textContent += ` ${message.text}`;
        }
        // 滚动到底部
        chatBox.scrollTop = chatBox.scrollHeight;
        transcriptionText += message.text;
    }
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