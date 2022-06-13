'use strict';

const cp = require('child_process');
const path = require('path');
const pack = require('../package.json');
const E_NPM_REGISTRY = 'http://nexus.17usoft.com/repository/npm-fe/';
const releaseVersion = pack.version;
console.log(`will release xprofiler@${releaseVersion}...\n`);

function run(cmd) {
  console.log(`Run: ${cmd}`);
  const options = { cwd: path.join(__dirname, '..'), maxBuffer: 48 * 1024 * 1024, stdio: 'inherit' };
  cp.execSync(cmd, options);
}

// release tag
const tagName = `v${releaseVersion}`;
// run(`git tag -d ${tagName}`);
run(`git tag ${tagName}`);
run(`git push -f origin ${tagName}`);

// publish to npm
run(`npm publish --registry=${E_NPM_REGISTRY}`);
// build linux-x64
run(`docker build -t xprofiler:${tagName} .`);

// build darwin-x64
run(`npm run build && npm run pack && npm run upload`);

console.log(`\nrelease xprofiler@${releaseVersion} done.`);
