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
const chatBox = document.getElementById('chat-box');

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
    document.getElementById('saveText').disabled = true;
}

//返回按钮
document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = './index.html';
});

//选择文件按钮
let selectedFilePath = null;
document.getElementById('chooseFile').addEventListener('click', async () => {
    clearChatBox();
    document.getElementById('status').textContent = "请选择格式为pcm的录音文件"
    selectedFilePath = await window.electronAPI.selectFile();
    if (selectedFilePath) {
    document.getElementById('status').textContent = `已选择文件: ${selectedFilePath}`;
    document.getElementById('startConvert').disabled = false;
    } else {
    document.getElementById('status').textContent = '未选择任何文件';
    }
});

//转换录音文件
document.getElementById('startConvert').addEventListener('click', async () => {
    clearChatBox();
    document.getElementById('status').textContent = '正在转换...';
    transcriptionText = '';
    const result = await window.electronAPI.transcribeFile(selectedFilePath);
    document.getElementById('startConvert').disabled = true;
    document.getElementById('saveText').disabled = false;
});
    
//保存文本
document.getElementById('saveText').addEventListener('click', async () => {
    const saveFlag = await window.electronAPI.saveTextToPDF(transcriptionText);
    if (saveFlag) {
    document.getElementById('status').textContent = `文本保存成功`;
    }
    else {
    document.getElementById('statusDisplay').textContent = `文本保存失败`;
    }
});

// 接收来自 WebSocket 的转录消息
window.electronAPI.onNewMessage((message) => {
    if (message.type === 'error') {
        document.getElementById('status').textContent = '转换失败';
    }
    else if (message.type === 'end'){
        document.getElementById('status').textContent = '转换完成';
    }
    else {
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

