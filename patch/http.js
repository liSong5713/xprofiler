'use strict';

const shimmer = require('./shimmer');
const http = require('http');
const https = require('https');

function requestListenerWrapper(original, methods) {
  const {
    addLiveRequest,
    addCloseRequest,
    addSentRequest,
    addRequestTimeout,
    addHttpStatusCode,
    patch_http_timeout,
    intercept_http_req,
  } = methods;
  const isIntercepted = typeof intercept_http_req === 'function';
  return function (req, res) {
    if (isIntercepted && intercept_http_req(req, res) === 'IGNORE_LOG') {
      // call origin function
      return original.apply(this, arguments);
    }
    addLiveRequest();

    const timer = setTimeout(() => {
      addRequestTimeout();
    }, patch_http_timeout * 1000);
    timer.unref();

    const start = Date.now();

    res.on('finish', () => {
      addHttpStatusCode(res.statusCode);
      addSentRequest(Date.now() - start);
      clearTimeout(timer);
    });

    res.on('close', () => {
      addCloseRequest();
      clearTimeout(timer);
    });

    // call origin function
    return original.apply(this, arguments);
  };
}

function serverWrapper(methods, original) {
  return function (opts, requestListener) {
    const args = Array.from(arguments);
    let returned;

    if (typeof opts === 'function') {
      args.splice(0, 1, requestListenerWrapper(opts, methods));
    } else if (typeof requestListener === 'function') {
      args.splice(1, 1, requestListenerWrapper(requestListener, methods));
    }

    returned = original.apply(this, args);

    return returned;
  };
}

function patchHttp(methods) {
  // patch http server
  shimmer.wrap(http, 'createServer', serverWrapper.bind(this, methods));
  // patch https server
  shimmer.wrap(https, 'createServer', serverWrapper.bind(this, methods));
}

module.exports = { patchHttp };
