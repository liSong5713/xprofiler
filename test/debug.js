'use strict';
const path = require('path');
const os = require('os');
const xprofiler = require('../xprofiler');
const http = require('http');

xprofiler.start({
  log_fragment: `os: ${os.hostname()}\tgroup: one-test`,
  log_dir: path.join('/Users/lisong/office/xprofiler', 'test', 'logs'), // 性能分析日志输出目录
  log_interval: 30,
  enable_log_uv_handles: true, // 不输出 uv 句柄分类详情
  enable_fatal_error_hook: false, //关闭v8 OOM 钩子
  log_format_alinode: false, // 以 alinode 的格式输出日志
  log_level: 1, // 只输出 info 日志
  intercept_http_req(req, res) {
    console.log(req.url);
    return 'IGNORE_LOG';
  },
});

let count = 0;
const server = http.createServer((req, res) => {
  const caches = [];
  req.on('data', (buf) => {
    caches.push(buf);
  });
  req.on('close', () => {
    console.log(req.url, 'close');
  });
  res.end('body:' + ++count);
});

server.listen(3000);
