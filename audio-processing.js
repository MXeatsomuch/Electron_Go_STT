const path = require('path');
const fs = require('fs');
const { console } = require('inspector');
/*
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
const { spawn } = require('child_process');
*/

const outputFile = 'tmp/output.pcm'; // 输出的 PCM 文件

async function convertFormat(filePath) {
    console.log("检查文件格式")
    const ext = path.extname(filePath).toLowerCase();
    if (ext!= ".pcm") {
      console.error("文件格式不支持")
    }
}

/*
//使用 ffmpeg 将 .wav 文件转换为 PCM 格式
async function convertWavToPcm(inputFile, outputFile) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputFile)
        .inputFormat('wav') // 输入格式为 WAV
        .audioCodec('pcm_s16le') // 将音频编码为 PCM signed 16-bit little-endian
        .audioChannels(1) // 单声道
        .audioFrequency(16000) // 采样率 16kHz
        .on('end', () => {
          console.log(`转换完成: ${outputFile}`);
          resolve(outputFile);
        })
        .on('error', (err) => {
          console.error(`转换失败: ${err.message}`);
          reject(err);
        })
        .save(outputFile); // 保存为 PCM 文件
    });
  }

  async function convertWavToPcm(inputFile, outputFile) {
    return new Promise((resolve, reject) => {
      const ffmpeg = require('fluent-ffmpeg');
  
      ffmpeg(inputFile)
        .inputFormat('wav') // 输入格式为 WAV
        .audioCodec('pcm_s16le') // 将音频编码为 PCM signed 16-bit little-endian
        .audioChannels(1) // 单声道
        .audioFrequency(16000) // 采样率 16kHz
        .on('end', () => {
          console.log(`转换完成: ${outputFile}`);
          resolve(outputFile);
        })
        .on('error', (err) => {
          console.error(`转换失败: ${err.message}`);
          reject(err);
        })
        .pipe(fs.createWriteStream(outputFile)); // 将输出流写入文件
    });
  }
  
  async function convertWavToPcm(inputFile, outputFile) {
    return new Promise((resolve, reject) => {
      const ffmpeg = require('fluent-ffmpeg');
  
      ffmpeg(inputFile)
        .inputFormat('wav') // 输入格式为 WAV
        .audioCodec('pcm_s16le') // 将音频编码为 PCM signed 16-bit little-endian
        .audioChannels(1) // 单声道
        .audioFrequency(16000) // 采样率 16kHz
        .on('end', () => {
          console.log(`转换完成: ${outputFile}`);
          resolve(outputFile);
        })
        .on('error', (err) => {
          console.error(`转换失败: ${err.message}`);
          reject(err);
        })
        .pipe(fs.createWriteStream(outputFile)); // 将输出流写入文件
    });
  }
*/
module.exports = {convertFormat};
