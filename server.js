const express = require('express')
const mongoose = require('mongoose')
const categoryRoutes = require('./routes/category')
const labRoutes = require('./routes/labs')
const whitelistmw = require('./middleware/whitelist')
const errorhandlermw = require('./middleware/errorhandler')
const s3obj = require('./api/s3')
const gdrive = require('./api/gdrive')
const claat = require('./api/claat')
const sitebuilder = require('./api/site')
const queues = require('./api/buildqueues')
const { google } = require('googleapis')
const {
  mongo: mongoConfig,
  port,
  cloudhubIP,
  aws: awsConfig,
  google: googleConfig,
  queue: queueConfig,
  cli: cliConfig,
} = require('./config')

const connectionString = `mongodb+srv://${mongoConfig.username}:${mongoConfig.password}@${mongoConfig.host}/${mongoConfig.db}?retryWrites=true&w=majority`

mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true }).then(async _ => {
  const app = express()

  s3obj.connect(awsConfig.accessKeyId, awsConfig.secretAccessKey)
  const jwtClient = new google.auth.JWT(
    googleConfig.client_email,
    null,
    googleConfig.private_key,
    ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/documents'],
    null
  )
  gdrive.connect(jwtClient)
  claat.connect(cliConfig.claat, jwtClient)
  sitebuilder.connect(cliConfig.site.dev, cliConfig.site.prod)

  //startup queues
  await queues.connect(mongoose.connection.db, queueConfig)

  whitelistmw(app, [cloudhubIP, '::1']) //whitelist middleware
  app.use(express.urlencoded({ extended: true })) //middleware to parse url encoded urls
  app.use(express.json()) //middleware to parse json bodies
  app.get('/health', (_req, res) => res.send({ message: 'OK' })) //health endpoint for monitoring
  app.use('/codelab', labRoutes) //setup lab service route handling
  app.use('/category', categoryRoutes) //setup category service route handling
  errorhandlermw(app) //error handling middleware

  app.listen(port, async _ => {
    console.log(`Server now listening on port ${port}`)
  })
})
