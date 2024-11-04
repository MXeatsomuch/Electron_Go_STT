const CryptoJS = require('crypto-js')
const WebSocket = require('ws')
var fs = require('fs')
var log = require('log4node')

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
    let wssUrl = config.hostUrl + "?appid=" + config.appid + "&ts=" + ts + "&signa=" + getSigna(ts);
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
  let rtasrResult = []
  try {
    let ws = await connectWebSocket();
    
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
            // ... do something
            let data = JSON.parse(res.data)
            rtasrResult[data.seg_id] = data
          // 把转写结果解析为句子
          if (data.cn.st.type == 0) {
            rtasrResult.forEach(i => {
              let str = "实时转写"
              str += (i.cn.st.type == 0) ? "【最终】识别结果：" : "【中间】识别结果："
              i.cn.st.rt.forEach(j => {
                j.ws.forEach(k => {
                  k.cw.forEach(l => {
                    str += l.w
                  })
                })
              })
              let end_flag = data.cn.st.type == 0 ? '0' : '1'
              onMessageCallback({ type: end_flag, text: str})
              log.info(str)
            })}
            // let str = ""
            // let end_flag = data.cn.st.type == 0 ? '0' : '1'
            // data.cn.st.rt.forEach(j => {
            //   j.ws.forEach(k => {
            //     k.cw.forEach(l => {
            //       str += l.w
            //     })
            //   })
            // })
            // log.info(str)
            // if (data.cn.st.type == 0){
            //   onMessageCallback({ type: end_flag, text: str})
            // }
            break
      }
    });

    // Other event listeners

  } catch (error) {
    console.error('Error starting WebSocket:', error);
    onMessageCallback({ type: 'error', message: error.message });
  }
}
  // return new Promise((resolve, reject) => {
  //   // 将wav文件转换为pcm文件

  //   // 获取当前时间戳并连接
  //   let ts = parseInt(new Date().getTime() / 1000)
  //   let wssUrl = config.hostUrl + "?appid=" + config.appid + "&ts=" + ts + "&signa=" + getSigna(ts)
  //   let ws = new WebSocket(wssUrl)

  //   ws.on('open', () => {
  //     const audioData = fs.readFileSync(filePath);
  //     const frameSize = 1280;  // 每次发送的音频数据大小
  //     let offset = 0;

  //     const sendFrame = () => {
  //       if (offset < audioData.length) {
  //         const endOffset = Math.min(offset + frameSize, audioData.length);
  //         const frame = audioData.slice(offset, endOffset);
  //         ws.send(frame);
  //         offset = endOffset;
  //         setTimeout(sendFrame, 40);  // 控制发送速度，避免 WebSocket 服务端拥塞
  //       } else {
  //         ws.send(JSON.stringify({ end: true }));  // 发送结束标识
  //       }
  //     };

  //     sendFrame();
  //   });

  //   ws.on('message', (message) => {
  //     const data = JSON.parse(message);
  //     if (data.code === 0 && data.data && data.data.result) {
  //       resolve({ text: data.data.result.text });
  //     } else if (data.code !== 0) {
  //       reject(data);
  //     }
  //   });

  //   ws.on('error', (err) => {
  //     reject(err);
  //   });
  // });

module.exports = { startTranscription };