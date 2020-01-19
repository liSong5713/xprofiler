'use strict';

const mm = require('mm');
const os = require('os');
const http = require('http');
const xprofiler = require('../../');

console.log('\n\n------- 1 -------\n\n');
if (process.env.XPROFILER_UNIT_TEST_TMP_HOMEDIR) {
  mm(os, 'homedir', () => process.env.XPROFILER_UNIT_TEST_TMP_HOMEDIR);
}
console.log('\n\n------- 2 -------\n\n');

xprofiler();

console.log('\n\n------- 3 -------\n\n');

// start log bypass
xprofiler.runLogBypass();

console.log('\n\n------- 4 -------\n\n');

xprofiler.runLogBypass();

console.log('\n\n------- 5 -------\n\n');

// start commands listener
xprofiler.runCommandsListener();

console.log('\n\n------- 6 -------\n\n');

xprofiler.runCommandsListener();


console.log('\n\n------- 7 -------\n\n');

// set v8 hooks
xprofiler.setHooks();

console.log('\n\n------- 8 -------\n\n');

xprofiler.setHooks();

console.log('\n\n------- 9 -------\n\n');

// http server
// const server = http.createServer(function (req, res) {
//   setTimeout(() => res.end('hello world.'), 100);
// });
// server.listen(8443, () => console.log('http server listen at 8443...'));
// server.unref();

// function sendRequest(abort) {
//   const req = http.request('http://localhost:8443');
//   req.on('error', err => console.error('non-blocking', err.message));
//   req.end();

//   if (abort) {
//     setTimeout(() => {
//       req.abort();
//     }, 50);
//   }
// }

// let times = 1;
// const interval = setInterval(() => {
//   if (times % 2 === 0) {
//     sendRequest(true);
//   } else {
//     sendRequest();
//   }
//   times++;
// }, 150);
// interval.unref();

setTimeout(() => {
  mm.restore();
  // clearInterval(interval);
  console.log('will close...');
  setTimeout(() => {
    // server.close();
    console.log('closed');
  }, 200);
}, 8000);
