'use strict';

let isMainThread = true;
let threadId = 0;
<<<<<<< HEAD
=======
let canIUseWorker = false;
>>>>>>> upstream/master
try {
  const workerThreads = require('worker_threads');
  isMainThread = workerThreads.isMainThread;
  threadId = workerThreads.threadId;
<<<<<<< HEAD
=======
  canIUseWorker = true;
>>>>>>> upstream/master
  /** Node.js v8.x compat: remove the unused catch-binding */
} catch (_) { /** ignore */ }

module.exports = {
  isMainThread,
  threadId,
<<<<<<< HEAD
=======
  canIUseWorker,
>>>>>>> upstream/master
};
