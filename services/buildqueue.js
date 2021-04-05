const mongoDbQueue = require('mongodb-queue')

const queue = async (db, name, timeout, interval, listener) => {
  const q = mongoDbQueue(db, name, {
    visibility: timeout,
  })
  q.push = async payload => {
    return new Promise((resolve, reject) => {
      q.add(payload, (err, res) => {
        if (err) {
          return reject(err)
        }
        return resolve(res)
      })
    })
  }
  processQueue(q, interval) //process queue before adding listener does polling setup
  await q.clean()
  q.listener = listener
  return q
}

const processQueue = async (q, interval) => {
  try {
    if (q.listener) {
      const msg = await get(q)
      if (msg) {
        await q.listener(msg.payload)
        await ack(q, msg.ack)
      }
    }
  } catch (ex) {
    console.error(ex)
  }
  setTimeout(processQueue, interval, q, interval)
}

const get = async queue => {
  return new Promise((resolve, reject) => {
    try {
      queue.get((err, msg) => {
        if (err) {
          return reject(err)
        }
        return resolve(msg)
      })
    } catch (ex) {
      return reject(x)
    }
  })
}

const ack = async (queue, ack) => {
  return new Promise((resolve, reject) => {
    queue.ack(ack, (err, id) => {
      if (err) {
        return reject(err)
      }
      return resolve(id)
    })
  })
}

module.exports = queue
