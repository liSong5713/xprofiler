'use strict';
const path = require('path');
const os = require('os');
const xprofiler = require('../xprofiler');

xprofiler.start({
  log_fragment: `os: ${os.hostname()}\tgroup: one-test`,
  log_dir: path.join(process.cwd(), 'logs'), // 性能分析日志输出目录
  log_interval: 20, // 采样间隔 120s
  enable_log_uv_handles: true, // 不输出 uv 句柄分类详情
  log_format_alinode: false, // 以 alinode 的格式输出日志
  log_level: 1, // 只输出 info 日志
});

setTimeout(()=>{},200000);