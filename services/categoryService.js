const LabCategory = require('../models/labCategory')
const utils = require('../api/utils')
const path = require('path')
const s3obj = require('../api/s3')
const { promises: fs } = require('fs')
const { aws: awsConfig } = require('../config')
const { ObjectId } = require('mongodb')

const existsByName = async name => {
  return await LabCategory.exists({ slug: utils.slugify(name) })
}

const existsById = async _id => {
  return await LabCategory.exists({ _id })
}

const canSetName = async (id, name) => {
  await LabCategory.exists({ slug: utils.slugify(name), _id: { $ne: id } })
}

const findById = async _id => {
  return await LabCategory.findById(_id)
}

const createCategory = async (payload, file) => {
  const newCategory = new LabCategory({
    name: payload.name,
    slackIcon: payload.slackIcon,
    slug: utils.slugify(payload.name),
    colors: {
      cardBorder: payload.cardBorderColor,
      button: payload.buttonColor,
    },
    image: file.filename,
  })
  await newCategory.save()
  await uploadCategory(file)
  return newCategory
}

const updateCategory = async (id, payload, file) => {
  const category = await LabCategory.findById(id)
  category.name = payload.name
  category.slug = utils.slugify(payload.name)
  category.colors.cardBorder = payload.cardBorderColor
  category.colors.buttonColor = payload.buttonColor
  category.slackIcon = payload.slackIcon
  file.filename = category.image
  await category.save()
  await uploadCategory(file)
}

const deleteById = async _id => {
  const category = await LabCategory.findById(_id)
  await LabCategory.deleteOne({ _id })
  const envs = Object.entries(awsConfig.s3.bucket)
  for (var i in envs) {
    const bucket = envs[i][1]
    await s3obj.deleteFile(bucket, path.join('images/icons', category.image))
  }
  await uploadCategory(null)
}

const uploadCategory = async file => {
  const tmpCssFile = await generateCSS()
  const envs = Object.entries(awsConfig.s3.bucket)
  for (var i in envs) {
    const bucket = envs[i][1]
    if (file) {
      await s3obj.uploadFile(file.path, bucket, path.join('images/icons', file.filename), {
        ContentType: file.mimetype,
      })
    }
    await s3obj.uploadFile(tmpCssFile, bucket, path.join('styles/', 'mulesoft.css'))
  }
}

const generateCSS = async _ => {
  var cssContent = ''
  const categories = await LabCategory.find()
  for (var i in categories) {
    const cat = categories[i]
    cssContent += `.codelab-card.category-${cat.slug} {
  border-bottom-color: ${cat.colors.cardBorder};
}

.${cat.slug}-bg {
  background-color: ${cat.colors.button};
}

.${cat.slug}-icon {
  background-image: url('/images/icons/${cat.image}');
}
`
  }
  const tmpCssFile = path.join(`/tmp/${utils.uuid()}.css`)
  await fs.writeFile(tmpCssFile, cssContent)
  return tmpCssFile
}

module.exports = {
  existsByName,
  existsById,
  findById,
  createCategory,
  updateCategory,
  deleteById,
  canSetName,
}
