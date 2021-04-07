const utils = require('../api/utils')
const buildQueues = require('../api/buildqueues')
const Lab = require('../models/lab')
const LabCategory = require('../models/labCategory')
const config = require('../config')
const gdrive = require('../api/gdrive')
const claat = require('../api/claat')
const { promises: fs } = require('fs')

const existsById = async _id => {
  return await Lab.exists({ _id })
}

const existsByTitle = async title => {
  return await existsByUrl(utils.slugify(title))
}

const existsByUrl = async url => {
  return await Lab.exists({ 'labConfig.labUrl': url })
}

const validCategory = async cats => {
  return await LabCategory.exists({ slug: utils.slugify(cats[0]) })
}

const buildLab = async (payload, params) => {
  const jobId = utils.uuid()
  await buildQueues[payload.env].push({
    id: params.id,
    job: 'PUBLISH',
    builtBy: payload.builtBy,
    callback: payload.callback,
    jobId,
  })
  return {
    jobId,
    message: 'Build queued',
  }
}

const unpublishLab = async (payload, params) => {
  const jobId = utils.uuid()
  if (params.env) {
    await buildQueues[params.env].push({
      id: params.id,
      job: 'UNPUBLISH',
      callback: payload,
      jobId
    })
  } else {
    const kvps = Object.entries(buildQueues)
    for (var i in kvps) {
      if (!kvps[i][1].push) continue
      await buildQueues[kvps[i][0]].push({
        id: params.id,
        job: 'UNPUBLISH',
        callback: payload,
        jobId
      })
    }
  }
  return {
    jobId,
    message: 'Unpublish queued'
  }
}

const importLab = async (payload, codelab) => {
  var mergeValues = {}
  mergeValues[codelab.oldUrl] = codelab.url
  const newFile = await gdrive.createFromTemplate(payload.docId, config.google.drive.folder.workspace.id, codelab.title, mergeValues)

  const insertedLab = new Lab({
    createdBy: payload.importedBy,
    labConfig: {
      labTitle: codelab.title,
      labSummary: codelab.summary,
      labCategories: codelab.category,
      labTags: codelab.tags,
      labAuthors: codelab.authors,
      labAuthorsLDAP: payload.importedBy,
      labUrl: codelab.url,
      feedbackUrl: codelab.feedback,
    },
    drive: {
      workspace: {
        id: newFile.id,
        created: new Date(),
      },
    },
  })
  await insertedLab.save()
  return insertedLab
}

const createLab = async payload => {
  payload.labConfig.labUrl = utils.slugify(payload.labConfig.labTitle)
  const newDoc = await gdrive.createFromTemplate(
    config.google.drive.template,
    config.google.drive.folder.workspace.id,
    payload.labConfig.labTitle,
    {
      '{{curDate}}': new Date().toISOString().slice(0, 10),
      ...Object.entries(payload.labConfig).reduce((acc, kvp) => {
        acc[`{{${kvp[0]}}}`] = kvp[1]
        return acc
      }, {}),
    }
  )

  payload.drive = {
    workspace: {
      id: newDoc.id,
      created: new Date(),
    },
  }

  const newLab = new Lab(payload)
  await newLab.save()
  return newLab
}

const claatFiles = async docId => {
  const path = await claat.build(docId)
  return await utils.getFiles(path)
}

const getCodelabObject = async docId => {
  const files = await claatFiles(docId)
  for (var i in files) {
    const file = files[i]
    if (file.absolutePath.endsWith('codelab.json')) return JSON.parse(await fs.readFile(file.absolutePath))
  }
  return null
}

const labById = async id => {
  return await Lab.findById(id)
}

module.exports = {
  buildLab,
  unpublishLab,
  existsById,
  existsByTitle,
  existsByUrl,
  importLab,
  createLab,
  validCategory,
  claatFiles,
  getCodelabObject,
  labById,
}
