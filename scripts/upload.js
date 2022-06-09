'use strict';

const fs = require('fs');
const path = require('path');
const request = require('request');
const dirname = path.join(__dirname, '../release');
const EFC_URL = 'http://efs.corp.elong.com/efcapi/upLoad';
const DOMAIN = '/m.elongstatic.com/xprofiler';
function base64Encode(file) {
  return file.toString('base64');
}

function checkFile(filepath) {
  try {
    const stat = fs.statSync(filepath);
    if (stat.size <= 0) {
      console.error(`文件 ${filepath} 为空文件`);
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}

function readdir(dirname) {
  const files = fs.readdirSync(dirname);
  return files
    .filter((name) => /\w.tar.gz$/gi.test(name))
    .filter((filename) => checkFile(path.join(dirname, filename)));
}

function upload(filepath) {
  const { base: filename } = path.parse(filepath);
  const [, version] = filename.split(/-/gi);
  const file = fs.readFileSync(filepath);
  const options = {
    url: EFC_URL,
    method: 'POST',
    form: {
      domain: DOMAIN,
      file: path.join(DOMAIN, version, filename),
      isunzip: 0,
      filebuffer: base64Encode(file),
    },
  };
  return new Promise((resolve, reject) => {
    request(options, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        console.log(body);
        return resolve(body);
      }
      reject(error);
      console.log(error);
    });
  });
}
function main(dirname) {
  const files = readdir(dirname);
  files.forEach((filename) => upload(path.join(dirname, filename)));
}

main(dirname);
