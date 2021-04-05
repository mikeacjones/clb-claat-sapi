const { IpFilter } = require('express-ipfilter')

const clientIp = (req, _res) => {
  if (process.env.NODE_ENV !== 'production') return '::1'
  var list = req.headers['x-forwarded-for'].split(',')
  const ip = list[list.length - 1].trim()
  console.log(`Client connection from: '${ip}'`)
  return ip
}

module.exports = (app, whitelist) => {
  app.use(
    IpFilter(whitelist, {
      detectIp: clientIp,
      forbidden: 'Not Authorized',
      strict: false,
      filter: whitelist,
      mode: 'allow',
    })
  )
}
