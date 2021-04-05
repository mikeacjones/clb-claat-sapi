const mongoose = require('mongoose')
const utils = require('../api/utils')
const { mongo: mongoConfig } = require('../config')

const schema = mongoose.Schema({
  created: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: String,
    required: true,
  },
  lastBuild: Date,
  lastBuiltBy: String,
  drive: {
    workspace: {
      id: String,
      created: Date,
    },
    dev: {
      id: String,
      created: Date,
    },
    prod: {
      id: String,
      created: Date,
    },
  },
  claat: {
    dev: {
      type: {
        codelab: mongoose.SchemaTypes.Mixed,
        lastBuild: Date,
        lastBuiltBy: String,
      },
      default: null,
    },
    prod: {
      type: {
        codelab: mongoose.SchemaTypes.Mixed,
        lastBuild: Date,
        lastBuiltBy: String,
      },
      default: null,
    },
  },
  labConfig: {
    labTitle: {
      type: String,
      required: true,
    },
    labSummary: {
      type: String,
      required: true,
    },
    labCategories: {
      type: [String],
      required: true,
    },
    labTags: {
      type: [String],
      required: true,
    },
    labAuthors: {
      type: String,
      required: true,
    },
    labAuthorsLDAP: {
      type: String,
      required: true,
    },
    labUrl: {
      type: String,
      required: true,
      default: function () {
        return utils.slugify(this.labConfig.labTitle)
      },
    },
    feedbackUrl: String,
  },
})

module.exports = mongoose.model('lab', schema, mongoConfig.collection.labs)
