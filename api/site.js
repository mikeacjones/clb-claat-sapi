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
  const oPath = env === 'dev' ? self.devSiteDir : self.prodSiteDir //path.join('/tmp', utils.uuid())
  //await utils.execAsync('git', ['clone', 'https://github.com/mikeacjones/codelab-web-app', oPath])
  /*await utils.execAsync('yarn', ['install'], {
    cwd: oPath,
    env: {
      ...process.env,
    }
  })*/
  await utils.execAsync('node_modules/.bin/gatsby', ['build'], {
    cwd: oPath,
    env: {
      ...process.env,
      BUILD_ENV: env,
      NODE_OPTIONS: '--max_old_space_size=460'
    },
  })
  console.log('api/site.js: yarn build done without issue')
  return path.join(oPath, 'public/')
}
