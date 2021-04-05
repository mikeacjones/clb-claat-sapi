module.exports = fn => (req, res, next) => {
  try {
    Promise.resolve(fn(req, res, next)).catch(err => {
      next(err)
    })
  } catch (err) {
    next(err)
  }
}
