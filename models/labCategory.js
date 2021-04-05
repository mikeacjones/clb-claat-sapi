const mongoose = require('mongoose')
const { mongo: mongoConfig } = require('../config')

const schema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  colors: {
    button: {
      type: String,
      required: true,
    },
    cardBorder: {
      type: String,
      required: true,
    },
  },
})

module.exports = mongoose.model('labCategory', schema, mongoConfig.collection.cats)