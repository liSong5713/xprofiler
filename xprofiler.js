'use strict';

const path = require('path');
const utils = require('./lib/utils');
const cleanUDS_FD = require('./lib/clean');
const { patch } = require('./patch');
const configure = require('./lib/configure');
const configList = require('./xprofiler.json');
const dayjs = require('dayjs');
const pkg = require('./package.json');
const workerThreads = require('./lib/worker_threads');

// xprofiler.node
const binary = require('@xprofiler/node-pre-gyp');
const bindingPath = binary.find(path.resolve(path.join(__dirname, './package.json')));
const xprofiler = require(bindingPath);
xprofiler.setup({
  isMainThread: workerThreads.isMainThread,
  threadId: workerThreads.threadId,
});

const runOnceStatus = {
  bypassLogThreadStarted: false,
  commandsListenerThreadStarted: false,
  hooksSetted: false,
};

let configured = false;

function checkNecessary() {
  if (!configured) {
    throw new Error('must run "require(\'xprofiler\')()" to set xprofiler config first!');
  }
}

/* istanbul ignore next */
function checkSocketPath(finalConfig) {
  const passed = xprofiler.checkSocketPath(true);
  if (!passed) {
    const message =
      'socket path is too long, complete log of this error can be found in:\n' +
      `  ${path.join(finalConfig.log_dir, `xprofiler-error-${dayjs().format('YYYYMMDD')}.log`)}\n`;
    if (finalConfig.check_throw) {
      throw new Error(message);
    }
    console.error(`\n[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] [error] [xprofiler-ipc] [${pkg.version}] ${message}`);
    return;
  }

  return passed;
}

function runOnce(onceKey, onceFunc) {
  checkNecessary();
  if (runOnceStatus[onceKey]) {
    return;
  }
  runOnceStatus[onceKey] = true;
  onceFunc();
}

function start(config = {}) {
  // set config by user and env
  const finalConfig = exports.setConfig(config);

  const singleModuleMode = process.env.XPROFILER_UNIT_TEST_SINGLE_MODULE === 'YES';

  if (workerThreads.isMainThread) {
    // check socket path
    checkSocketPath(finalConfig);
    // clean uds fd & set logdir info to file
    cleanUDS_FD(finalConfig.uds_dir);
    utils.setLogDirToFile(finalConfig.log_dir);
    if (!singleModuleMode) {
      // start commands listener thread if needed
      exports.runCommandsListener();
    }
  }

  if (!singleModuleMode) {
    // start performance log thread if needed
    exports.runLogBypass();
    // set hooks
    exports.setHooks();
  }

  // patch modules
  patch(finalConfig, {
    // http status
    addLiveRequest: xprofiler.addLiveRequest,
    addCloseRequest: xprofiler.addCloseRequest,
    addSentRequest: xprofiler.addSentRequest,
    addRequestTimeout: xprofiler.addRequestTimeout,
    addHttpStatusCode: xprofiler.addHttpStatusCode,
  });
}

exports = module.exports = start;

exports.start = start;

exports.setConfig = function (config) {
  // set config
  const finalConfig = configure(configList, config);
  configured = true;
  xprofiler.configure(finalConfig);

  return finalConfig;
};

exports.getXprofilerConfig = function () {
  checkNecessary();
  return xprofiler.getConfig();
};

['info', 'error', 'debug'].forEach(
  (level) =>
    (exports[level] = function (...args) {
      checkNecessary();
      xprofiler[level](...args);
    }),
);

exports.runLogBypass = runOnce.bind(null, 'bypassLogThreadStarted', xprofiler.runLogBypass);

exports.runCommandsListener = runOnce.bind(null, 'commandsListenerThreadStarted', xprofiler.runCommandsListener);

exports.setHooks = runOnce.bind(null, 'hooksSetted', xprofiler.setHooks);
