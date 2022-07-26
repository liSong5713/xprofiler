'use strict';

const os = require('os');
const path = require('path');
const utils = require('./utils');

const defaultConfig = {
  log_dir: os.tmpdir(),
  uds_dir: path.join(process.cwd(), '.xprofiler'),
  log_interval: 60, // seconds
  enable_log_uv_handles: true,
  log_level: 1,
  log_type: 0,
  patch_http: true,
  patch_http_timeout: 30, // seconds，
  check_throw: true,
  enable_fatal_error_hook: true,
  enable_fatal_error_report: true,
  enable_fatal_error_coredump: false,
};

function getFinalUserConfigure(envConfig, userConfig) {
  // check user configured log_dir is accessiable
  const finalConfig = Object.assign({}, defaultConfig, envConfig, userConfig);
  // prepare the dir
  [finalConfig.log_dir, finalConfig.uds_dir].forEach((dir) => utils.readyDir(dir));
  return finalConfig;
}

const simpleCheck = {
  string: (value) => typeof value === 'string',
  path: (value) => path.normalize(value),
  number: (value) => value !== null && !isNaN(value),
  boolean: (value) => ['YES', 'NO', true, false].includes(value),
  function: (value) => typeof value === 'function',
};

const formatValue = {
  string: (value) => String(value),
  number: (value) => Number(value),
  boolean: (value) => (['YES', 'NO'].includes(value) ? value === 'YES' : value),
  function: (value) => value,
};

function checkRule(rules, value, { config, key, format }) {
  if (rules.every((rule) => simpleCheck[rule] && simpleCheck[rule](value))) {
    config[key] = typeof format === 'function' && format(value);
  }
}

module.exports = function (configList, user) {
  const envConfig = {};
  const userConfig = {};
  for (const config of configList) {
    const rules = config.rules;
    const key = config.name;
    const format = formatValue[config.format];
    const envValue = process.env[config.env];
    checkRule(rules, envValue, { config: envConfig, key, format });
    const userValue = user[config.name];
    checkRule(rules, userValue, { config: userConfig, key, format });
  }
  return getFinalUserConfigure(envConfig, userConfig);
};
