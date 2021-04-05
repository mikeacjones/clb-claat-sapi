const path = require('path')
const utils = require('./utils')
const { promises: fs } = require('fs')

module.exports = new site()

function site() {}

site.prototype.connect = function (devSiteDir, prodSiteDir) {
  this.devSiteDir = devSiteDir
  this.prodSiteDir = prodSiteDir
}

site.prototype.build = async function (env) {
  const self = this
  const cwd = env === 'prod' ? self.prodSiteDir : self.devSiteDir
  await utils.execAsync('yarn', ['build'], {
    cwd,
    stdio: 'pipe',
    env: {
      BUILD_ENV: env,
    },
  })
  console.log('api/site.js: yarn build done without issue')
  return path.join(cwd, 'public/')
}
