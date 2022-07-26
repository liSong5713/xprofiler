'use strict';

const { patchHttp } = require('./http');

function patch(config, methods) {
  if (config.patch_http) {
    const { patch_http_timeout, intercept_http_req } = config;
    patchHttp({
      ...methods,
      patch_http_timeout,
      intercept_http_req,
    });
  }
}

module.exports = { patch };
