const WebSocket = require('electron').net;
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 系统配置
const config = {
    // 请求地址
    hostUrl: "wss://rtasr.xfyun.cn/v1/ws",
    //在控制台-我的应用-实时语音转写获取
    appid: "944aa7dd",
    //在控制台-我的应用-实时语音转写获取
    apiKey: "99e1e0eebdfdabedb761ee0e2f6e26c4",
    file: "./test_1.pcm",//请填写您的音频文件路径
    highWaterMark: 1280
  }

// 鉴权签名
function getSigna(ts) {
    let md5 = CryptoJS.MD5(config.appid + ts).toString()
    let sha1 = CryptoJS.HmacSHA1(md5, config.apiKey)
    let base64 = CryptoJS.enc.Base64.stringify(sha1)
    return encodeURIComponent(base64)
  }

async function startTranscription(filePath) {
  return new Promise((resolve, reject) => {
    // 将wav文件转换为pcm文件

    // 获取当前时间戳并连接
    let ts = parseInt(new Date().getTime() / 1000)
    let wssUrl = config.hostUrl + "?appid=" + config.appid + "&ts=" + ts + "&signa=" + getSigna(ts)
    let ws = new WebSocket(wssUrl)

    ws.on('open', () => {
      const audioData = fs.readFileSync(filePath);
      const frameSize = 1280;  // 每次发送的音频数据大小
      let offset = 0;

      const sendFrame = () => {
        if (offset < audioData.length) {
          const endOffset = Math.min(offset + frameSize, audioData.length);
          const frame = audioData.slice(offset, endOffset);
          ws.send(frame);
          offset = endOffset;
          setTimeout(sendFrame, 40);  // 控制发送速度，避免 WebSocket 服务端拥塞
        } else {
          ws.send(JSON.stringify({ end: true }));  // 发送结束标识
        }
      };

      sendFrame();
    });

    ws.on('message', (message) => {
      const data = JSON.parse(message);
      if (data.code === 0 && data.data && data.data.result) {
        resolve({ text: data.data.result.text });
      } else if (data.code !== 0) {
        reject(data);
      }
    });

    ws.on('error', (err) => {
      reject(err);
    });
  });
}

module.exports = { startTranscription };