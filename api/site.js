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
  await utils.execAsync('node_modules/.bin/gatsby', ['build'], {
    cwd,
    stdio: 'pipe',
    env: {
      ...process.env,
      BUILD_ENV: env,
      NODE_OPTIONS: '--max_old_space_size=460'
    },
  })
  console.log('api/site.js: yarn build done without issue')
  return path.join(cwd, 'public/')
}
