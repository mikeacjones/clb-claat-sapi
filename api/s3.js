const async = require('async')
const mime = require('mime-types')
const { getFiles } = require('./utils')
const { promises: fs } = require('fs')
const { S3 } = require('aws-sdk')

function S3Object() {}
module.exports = new S3Object()

S3Object.prototype.connect = function (accessKeyId, secretAccessKey) {
  this.s3obj = new S3({
    signatureVersion: 'v4',
    accessKeyId,
    secretAccessKey,
  })
}

S3Object.prototype.deleteFile = async function (Bucket, Key) {
  const self = this
  return new Promise(async (res, rej) => {
    self.s3obj.deleteObject(
      {
        Bucket,
        Key,
      },
      err => {
        if (err) return rej(new Error(err))
        else res({ result: true })
      }
    )
  })
}

S3Object.prototype.deleteFolder = async function (Bucket, Folder) {
  const self = this
  return new Promise((res, rej) => {
    self.s3obj.listObjectsV2(
      {
        Bucket,
        Prefix: Folder,
      },
      async (err, data) => {
        if (err) return rej(new Error(err))
        if (data.Contents.length === 0) return res({ result: true })
        var params = { Bucket }
        params.Delete = { Objects: [] }
        data.Contents.forEach(c => params.Delete.Objects.push({ Key: c.Key }))
        self.s3obj.deleteObjects(params, async err => {
          if (err) return rej(err)
          if (data.Contents.length === 1000) {
            try {
              await self.deleteFolder(Bucket, Folder)
              return res({ result: true })
            } catch (ex) {
              return rej(ex)
            }
          }
          return res({ result: true })
        })
      }
    )
  })
}

S3Object.prototype.uploadFile = async function (absolutePath, Bucket, Key, opts = {}) {
  const self = this
  return new Promise(async (res, rej) => {
    self.s3obj.upload(
      {
        Key,
        Bucket,
        Body: await fs.readFile(absolutePath),
        ContentType: mime.lookup(absolutePath),
        ...opts,
      },
      err => {
        if (err) return rej(new Error(err))
        console.log(`api/s3.js: File ${absolutePath} uploaded to ${Bucket} as ${Key}`)
        res({ result: true })
      }
    )
  })
}

S3Object.prototype.uploadFolder = async function (dir, bucket, baseKey = '') {
  const self = this
  if (baseKey.startsWith('/')) baseKey = baseKey.substr(1)
  const files = await getFiles(dir, baseKey)

  return new Promise((resolve, reject) => {
    async.eachOfLimit(
      files,
      10,
      async file => {
        try {
          await self.uploadFile(file.absolutePath, bucket, file.relativePath)
        } catch (ex) {
          console.log(`api/s3.js: While uploading folder file failed: ${file.absolutePath}`)
        }
      },
      err => {
        if (err) {
          return reject(new Error(err))
        }
        resolve({ result: true })
      }
    )
  })
}
