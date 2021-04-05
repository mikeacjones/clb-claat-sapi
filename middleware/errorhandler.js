const { IpDeniedError } = require('express-ipfilter')

module.exports = app => {
  app.use((err, _req, res, _next) => {
    console.log('Error handler', err)
    console.error(JSON.stringify(err))

    if (err instanceof IpDeniedError) {
      return res.status(401).send({ message: 'Access denied' })
    }

    if (err.name === 'ValidationError') {
      return res.status(400).send({ message: err.message })
    }

    if (err.name === 'CastError' && err.kind === 'ObjectId') {
      return res.status(404).send({ message: `Resource with ID '${err.value}' not found`})
    }

    if (err.code && err.message) {
      return res.status(err.code).send({ message: err.message })
    }

    res.status(500).send({ message: 'Internal error occurred' })
    console.error(JSON.stringify(err))
  })
}
