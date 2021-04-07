const gdrive = require('../api/gdrive')
const claat = require('../api/claat')
const Lab = require('../models/lab')
const s3obj = require('../api/s3')
const site = require('../api/site')
const config = require('../config')
const path = require('path')
const axios = require('axios')
const { promises: fs } = require('fs')

const build = env => async msg => {
  const { id, builtBy, callback: cb, jobId, job } = msg
  console.log(`Starting job: ${jobId}`)
  let siteNeedsBuild = true
  try {
    switch (job) {
      case 'PUBLISH':
        siteNeedsBuild = await publishLab(id, env, builtBy)
        break
      case 'UNPUBLISH':
        await unpublishLab(id, env)
        break
    }
    if (siteNeedsBuild) await buildSite(env)
    else {
      await callback(cb, { status: 'success', jobId })
      console.log(`Callback called without error`)
    }
  } catch (ex) {
    console.log(ex)
    console.error(ex)
    callback(cb, {
      status: 'fail',
      jobId,
      error: ex.message || JSON.stringify(ex),
    })
  }
}

const updateLabFields = async (lab, env, builtBy, newFileId, labPath) => {
  lab.lastBuild = new Date()
  lab.lastBuiltBy = builtBy

  if (!lab.drive) lab.drive = {}
  if (!lab.claat) lab.claat = {}
  if (!lab.drive[env]) lab.drive[env] = {}
  if (!lab.claat[env]) lab.claat[env] = {}

  lab.drive[env].id = newFileId
  lab.drive[env].created = new Date()
  lab.claat[env].codelab = JSON.parse(await fs.readFile(path.join(labPath, lab.labConfig.labUrl, 'codelab.json')))
  lab.claat[env].lastBuild = new Date()
  lab.claat[env].lastBuiltBy = builtBy
}

const publishLab = async (id, env, builtBy) => {
  const lab = await Lab.findById(id)
  const labObject = lab.toObject()
  let siteNeedsBuild = true
  if (labObject.claat && labObject.claat[env]) siteNeedsBuild = false
  console.log(`Retrieved codelab from database`)
  if (!lab) return

  const sourceEnv = config.google.drive.folder[env].promoteFrom
  const oldFileId = lab.drive[env].id
  const newFile = await gdrive.copyDoc(lab.drive[sourceEnv].id, config.google.drive.folder[env].id)
  console.log(`New copy made from source environment '${sourceEnv}' to build environment '${env}'`)

  lab.drive[env].id = newFile.id
  await lab.save()
  await gdrive.deleteDoc(oldFileId)
  console.log(`File with id '${newFile.id}' replaces old file with id '${oldFileId}'; old file deleted`)

  const claatPath = await claat.build(newFile.id)
  console.log(`Build complete; files local location: ${claatPath}`)

  await s3obj.uploadFolder(claatPath, config.aws.s3.bucket[env], 'codelabs/')
  console.log(`Codelab files uploaded to s3 bucket successfully`)
  await updateLabFields(lab, env, builtBy, newFile.id, claatPath)
  await lab.save()
  console.log(`Codelab updated in database`)
  return siteNeedsBuild
}

const unpublishLab = async (id, env) => {
  const lab = await Lab.findById(id)
  if (!lab) return
  if (!lab.claat[env].codelab) return
  if (lab.claat[env].codelab) {
    await s3obj.deleteFolder(config.aws.s3.bucket[env], path.join('codelabs/', lab.claat[env].codelab.url))
    lab.claat[env] = null
  }
  if (lab.drive[env]) {
    await gdrive.deleteDoc(lab.drive[env].id)
    lab.drive[env] = null
  }
  await lab.save()
}

const buildSite = async (env, callback, jobId) => {
  try {
    await axios.post(
      'https://api.github.com/repos/mulesoft-consulting/codelabs-web-app/dispatches',
      {
        event_type: config.environment,
        client_payload: {
          target_bucket: config.aws.s3.bucket[env],
          build_env: env,
          callback: {
            url: callback.url,
            headers: callback.headers ? JSON.stringify(callback.headers) : '{}',
            jobId,
          },
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github.v3+json',
          Authorization: `Bearer ${config.github.token}`,
        },
      }
    )
    console.log('services/buildhandler.js: Called repository_dispatch successfull')
  } catch (ex) {
    console.log(ex)
  }
}

const callback = async (cb, payload) => {
  try {
    await axios.post(cb.url, payload, {
      headers: { 'Content-Type': 'application/json', ...cb.headers },
    })
  } catch {}
}

module.exports = { build }
