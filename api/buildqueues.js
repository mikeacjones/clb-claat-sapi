const buildhandler = require('../services/buildhandler')
const buildqueue = require('../services/buildqueue')
//startup queue listeners
const buildQueues = {}
buildQueues.connect = async function (db, queueConfig) {
  const queueEntries = Object.entries(queueConfig.names)
  for (var i in queueEntries) {
    const queue = queueEntries[i]
    if (!queue[1] || queue[1] === '') continue
    buildQueues[queue[0]] = await buildqueue(db, queue[1], queueConfig.timeout, queueConfig.interval, buildhandler.build(queue[0]))
  }
}

module.exports = buildQueues
