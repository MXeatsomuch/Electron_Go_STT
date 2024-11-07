 ## 运行
1. 确保安装了sox，并已经添加到环境变量中，可在终端执行命令`sox --version` 检查是否成功安装，没有安装可打开sox-14.4.1a-win32.exe进行安装
2. 在项目根目录中执行命令 `electron .` 运行程序

## 错误
1. 如果遇到了  sox has exited with error code null，这是因为录音过程中会通过child_process.spawn()创建sox进程进行录音，kill掉sox进程会导致返回的code为null，所以要在`node_modules\node-record-lpcm16\index.js`第50行的
   ```js
   cp.on('close', code => {
      if (code === 0) return
      rec.emit('error', `${this.cmd} has exited with error code ${code}.Enable debugging with the environment variable DEBUG=record.`
      )
    })
   ```
   修改如下

   ```js
    cp.on('close', code => {
      if (code === 0 || code === null) return
      rec.emit('error', `${this.cmd} has exited with error code ${code}.Enable debugging with the environment variable DEBUG=record.`
      )
    })
   ```