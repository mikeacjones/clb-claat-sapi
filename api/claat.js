const utils = require('./utils')
const path = require('path')

module.exports = new claat()

function claat() {}

claat.prototype.connect = function (cliPath, jwtClient) {
  this.cliPath = cliPath
  this.jwtClient = jwtClient
}

claat.prototype.build = async function (id) {
  const oPath = path.join('/tmp', utils.uuid())
  console.log(`api/claat.js: Building claat to temp folder: ${oPath}`)
  await this.jwtClient.authorize()
  const { token } = await this.jwtClient.getAccessToken()
  console.log('api/claat.js: Generated JWT token')
  await utils.execAsync(this.cliPath, ['export', '-o', oPath, '-auth', token, id])
  console.log('api/claat.js: Claat CLI done processing')
  return oPath
}
