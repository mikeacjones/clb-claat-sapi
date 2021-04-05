const express = require('express')
const asyncmw = require('../middleware/async')
const router = express.Router()
const utils = require('../api/utils')
const config = require('../config')
const buildQueues = require('../api/buildqueues')
const labService = require('../services/labService')

router.post(
  '/',
  asyncmw(async (req, res, _next) => {
    const payload = req.body
    //validate we won't be overriding something
    if (await labService.existsByTitle(payload.labConfig.labTitle)) {
      throw { code: 409, message: 'A codelab with that name already exists' }
    }
    //validate we have a valid category
    if (!(await labService.validCategory(payload.labConfig.labCategories))) {
      throw { code: 400, message: 'Invalid category specified' }
    }
    //send payload to lab service
    return res.send(await labService.createLab(payload))
  })
)

router.post(
  '/import',
  asyncmw(async (req, res, _next) => {
    //for importing, as part of our starting validation we actually build the codelab and check the return
    //we do this because we don't have any information about the lab already
    const payload = req.body
    var codelab
    try {
      codelab = await labService.getCodelabObject(payload.docId)
    } catch {}
    if (!codelab)
      throw {
        //if the build fails, we probably don't have access; the doc might also not exist
        code: 404,
        message: 'Please validate the bot has access to the google doc and that the google doc is a valid claat',
      }

    //when importing a lab, we will change whatever they had for url to the slugified title, as per our standard
    //will store the old url to use with a find and replace
    codelab.oldUrl = codelab.url
    codelab.url = utils.slugify(codelab.title)
    if (await labService.existsByUrl(codelab.url))
      throw {
        code: 409,
        message: `A lab with slug '${codelab.url}' already exists`,
      }
    if (!(await labService.validCategory(codelab.category))) {
      throw {
        code: 400,
        message: `The lab's primary category ${codelab.category[0]} does not exist`,
      }
    }
    //at this point we've passed all of our checks; pass info to labService
    return res.send(await labService.importLab(payload, codelab))
  })
)

router.post(
  '/:id/build',
  asyncmw(async (req, res, _next) => {
    const payload = req.body
    const params = req.params

    //validate the destination environment has a build queue
    if (!buildQueues[payload.env]) {
      throw {
        code: 501,
        message: `Building to environment ${payload.env} is not currently supported`,
      }
    }
    //validate the specified lab exists
    if (!(await labService.existsById(params.id))) {
      throw { code: 404, message: `Lab with id '${params.id}' does not exist` }
    }
    //if the target environment requires it, validate that they have built the promoteFrom environment
    const { promoteFrom, requirePrevious } = config.google.drive.folder[payload.env]
    if (!promoteFrom) {
      //if the environment does not have a promoteFrom, you can't promote to this environment. eg: workspace
      throw {
        code: 406,
        message: 'You can not promote to this environment',
      }
    }
    if (requirePrevious) {
      const lab = await labService.labById(params.id)
      if (!lab.claat?.[promoteFrom]?.codelab) {
        throw {
          code: 406,
          message: `You can not promote lab to ${payload.env} before promoting to ${promoteFrom}`,
        }
      }
    }

    //all checks have passed - send payload to labService
    const job = await labService.buildLab(payload, params)
    return res.status(202).send(job)
  })
)

router.post(
  '/:id/unpublish',
  asyncmw(async (req, res, _next) => {
    const payload = req.body
    const params = req.params
    //validate the specified lab exists
    if (!(await labService.existsById(params.id))) {
      throw { code: 404, message: `Lab with id '${params.id}' does not exist` }
    }
    res.status(202).send(await labService.unpublishLab(payload, params))
  })
)

router.post(
  '/:id/unpublish/:env',
  asyncmw(async (req, res, _next) => {
    const payload = req.body
    const params = req.params
    //validate the specified lab exists
    if (!(await labService.existsById(params.id))) {
      throw { code: 404, message: `Lab with id '${params.id}' does not exist` }
    }
    res.status(202).send(await labService.unpublishLab(payload, params))
  })
)

module.exports = router
