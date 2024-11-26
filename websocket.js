const CryptoJS = require('crypto-js')
const WebSocket = require('ws')
var fs = require('fs')
var log = require('log4node')
const recorder = require('node-record-lpcm16');
const { start } = require('repl');
const { info } = require('console');

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
function connectWebSocket() {
  return new Promise((resolve, reject) => {
    // 获取当前时间戳
    let ts = parseInt(new Date().getTime() / 1000);
    let args = "&roleType=2"
    let wssUrl = config.hostUrl + "?appid=" + config.appid + "&ts=" + ts + "&signa=" + getSigna(ts) + args;

    let ws = new WebSocket(wssUrl);

    ws.on('open', () => {
      console.log("WebSocket connected!");

      resolve(ws);
    });

    ws.on('error', (err) => {
      console.error("WebSocket connection error: " + err);
      reject(err);
    });
  });
}


async function startTranscription(filePath, onMessageCallback) {
  try {
    let ws = await connectWebSocket();
    let curRole = 1; //角色从1开始
    let str = "";
    ws.on('message', (data) => {
      // Handle incoming messages
      let res = JSON.parse(data)
      console.log('Received message:', res.action);
      switch (res.action) {
        case 'error':
          log.info(`error code:${res.code} desc:${res.desc}`)
          onMessageCallback({ type: 'error', code: res.code, desc: res.desc });
          break
          // 连接建立
        case 'started':
          log.info('started!')
          log.info('sid is:' + res.sid)
          // 开始读取文件进行传输
          var readerStream = fs.createReadStream(filePath, {
            highWaterMark: config.highWaterMark
          });
          readerStream.on('data', function (chunk) {
            ws.send(chunk)
          });
          readerStream.on('end', function () {
            // 最终帧发送结束
            ws.send("{\"end\": true}")
          });
            break
          case 'result':
            let data = JSON.parse(res.data)
            if (data.cn.st.type == 0){
              data.cn.st.rt.forEach(j => {
                log.info(res.data)
                j.ws.forEach(k => {
                  k.cw.forEach(l => {
                    if(l.rl == curRole || l.rl == 0) { //没有切换角色
                      str += l.w
                    }
                    else {// 角色切换
                      if(str != "") {
                        log.info(str)
                        onMessageCallback({ type:'success', role: curRole, text: str})
                        str = ""
                      }
                      curRole = l.rl
                      str += l.w
                    }
                  })
                })
              })
              if(str != "") {
                log.info(str)
                onMessageCallback({ type:'success', role: curRole, text: str})
                str = ""
              }
            }
            break
      }
    });
    ws.on('close', () => {
      console.log('WebSocket 连接关闭');
      onMessageCallback({ type:'end'});
    });

    // Other event listeners

  } catch (error) {
    console.error('Error starting WebSocket:', error);
    onMessageCallback({ type: 'error', message: error.message });
  }
}

let isRtPaused = false;
let audioStream = null;
let ws = null;
let audioChunks = [];
async function startRealtimeRecording(event) {
  isRtPaused = false;
  let str = ""
  let curRole = 1; //角色从1开始
  try {
    ws = await connectWebSocket();

    ws.on('message', (data) => {
      let res = JSON.parse(data)
      console.log('Received message:', res.action);
      switch (res.action) {
        case 'error': 
          console.error(`error code:${res.code} desc:${res.desc}`)
          event.reply('realtime-status-update', `error code:${res.code} desc:${res.desc}`)
          break
        case 'started':
          let count = 1;
          event.reply('realtime-status-update', '连接成功，开始录音');
          console.log('开始录音并发送音频流');
          // 开始录音
          audioStream = recorder.record({
            sampleRate: 16000, // 采样率16kHz
            channels: 1,        // 单声道
            bitDepth: 16,       // 位长16位
            threshold: 0,
            verbose: false,
            silence: '20.0',
          });
          // 每40ms发送1280字节数据到服务器
          const chunkSize = 1280;
          audioChunks = [];
          let nextSendPosition = 0;
          let buffer = Buffer.alloc(0);
          audioStream.stream().on('data', (chunk) => {
            if (!isRtPaused) {
              audioChunks.push(chunk);
              buffer = Buffer.concat([buffer, chunk]);
              while (buffer.length >= nextSendPosition + chunkSize) {
                const chunkToSend = buffer.subarray(nextSendPosition, nextSendPosition + chunkSize);
                ws.send(chunkToSend);
                nextSendPosition += chunkSize;
                console.log(' 发送音频流: ', count++)
              }
            }
          });
          break
        case 'result':
          let data = JSON.parse(res.data)
          if (data.cn.st.type == 0){
            data.cn.st.rt.forEach(j => {
              log.info(res.data)
              j.ws.forEach(k => {
                k.cw.forEach(l => {
                  if(l.rl == curRole || l.rl == 0) { //没有切换角色
                    str += l.w
                  }
                  else {// 角色切换
                    if(str != "") {
                      log.info(str)
                      event.reply('realtime-transcription-result', { type:'success', role: curRole, text: str})
                      str = ""
                    }
                    curRole = l.rl
                    str += l.w
                  }
                })
              })
            })
            if(str != "") {
              log.info(str)
              event.reply('realtime-transcription-result', { type:'success', role: curRole, text: str})
              str = ""
            }
          }
          break 
        }
    });
    
  } catch (error) {
    console.error('Error starting realtime recording:', error);
    event.reply('realtime-status-update', error.message);
  }

}

function pauseRealtimeRecording(event) {
  isRtPaused = true;
  console.log('录音暂停');
  event.reply('realtime-status-update', '录音暂停');
}

function resumeRealtimeRecording(event) {
  isRtPaused = false;
  console.log('录音恢复');
  event.reply('realtime-status-update', '录音恢复');
}

function stopRealtimeRecording(event) {
  isRtPaused = true;
  setTimeout(() => {
    audioStream.stop()
  }, 40)
  audioStream.stream().on('stopComplete', () => {
    event.reply('realtime-status-update', '录音结束');
    console.log('录音结束');
  })
  ws.send("{\"end\": true}");
  ws.on('close', () => {
    event.reply('realtime-status-update', 'WebSocket 连接已关闭');
    console.log('WebSocket 连接已关闭');
  })
  return audioChunks;
}
module.exports = { 
  startTranscription, 
  startRealtimeRecording, 
  pauseRealtimeRecording,
  resumeRealtimeRecording,
  stopRealtimeRecording
};