const path = require('path')

module.exports = {
  baseFeedbackUrl: process.env.BASE_FEEDBACK_URL,
  environment: process.env.ENVIRONMENT,
  github: {
    token: process.env.GITHUB_TOKEN,
  },
  port: process.env.PORT || 3000,
  cloudhubIP: process.env.CLOUDHUB_IP,
  cli: {
    claat: path.join(__dirname, 'cli/claat'),
    site: {
      prod: path.join(__dirname, 'site/'),
      dev: path.join(__dirname, 'site-dev/'),
    },
  },
  queue: {
    timeout: 10 * 60,
    interval: 5000,
    names: {
      dev: process.env.QUEUE_BUILD_DEV,
      prod: process.env.QUEUE_BUILD_PROD,
    },
  },
  mongo: {
    host: process.env.MONGO_HOST,
    username: process.env.MONGO_USERNAME,
    password: process.env.MONGO_PASSWORD,
    db: process.env.MONGO_DB,
    collection: {
      labs: process.env.MONGO_COLLECTION_LABS,
      cats: process.env.MONGO_COLLECTION_CATS,
    },
  },
  google: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/gm, '\n'),
    drive: {
      template: process.env.DRIVE_TEMPLATE,
      folder: {
        workspace: {
          id: process.env.DRIVE_FOLDER_WORKSPACE,
        },
        dev: {
          id: process.env.DRIVE_FOLDER_DEV,
          promoteFrom: 'workspace',
          requirePrevious: false,
        },
        prod: {
          id: process.env.DRIVE_FOLDER_PROD,
          promoteFrom: 'dev',
          requirePrevious: true,
        },
      },
    },
  },
  aws: {
    s3: {
      bucket: {
        dev: process.env.S3_BUCKET_DEV,
        prod: process.env.S3_BUCKET_PROD,
      },
    },
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_ACCESS_SECRET,
  },
}
