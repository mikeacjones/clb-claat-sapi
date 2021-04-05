const express = require('express')
const asyncmw = require('../middleware/async')
const router = express.Router()
const multer = require('multer')
const uploads = multer({ dest: '/tmp/uploads/' })
const categoryService = require('../services/categoryService')

router.post(
  '/',
  uploads.single('image'),
  asyncmw(async (req, res, _next) => {
    const payload = req.body
    if (await categoryService.existsByName(payload.name)) {
      throw { code: 409, message: 'A category with that name already exists' }
    }
    res.send(await categoryService.createCategory(payload, req.file))
  })
)

router.put(
  '/:id',
  uploads.single('image'),
  asyncmw(async (req, res, _next) => {
    const params = req.params
    const payload = req.body

    const category = await categoryService.findById(params.id)
    if (!category) {
      throw { code: 404, message: `Category with ID ${req.params.id} does not exist` }
    }
    if (!(await categoryService.canSetName(params.id, payload.name))) {
      throw { code: 409, message: 'A category with that name already exists' }
    }

    await categoryService.updateCategory(params.id, payload, req.file)
    res.status(204).send()
  })
)

router.delete(
  '/:id',
  asyncmw(async (req, res, _next) => {
    if (!(await categoryService.existsById(req.params.id))) {
      throw { code: 404, message: `Category with ID ${req.params.id} does not exist` }
    }
    await categoryService.deleteById(req.params.id)
    res.status(204).send()
  })
)

module.exports = router
