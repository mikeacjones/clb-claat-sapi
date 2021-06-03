const { google } = require('googleapis')
const drive = google.drive('v3')
const docs = google.docs('v1')

module.exports = new gdrive()

function gdrive() {}

gdrive.prototype.connect = function (jwtClient) {
  this.jwtClient = jwtClient
}

gdrive.prototype.copyDoc = async function (sourceDocId, destinationFolderId, docChanges = {}) {
  const { data: sourceFile } = await drive.files.get({
    auth: this.jwtClient,
    fileId: sourceDocId,
    supportsAllDrives: true,
  })

  const { data: newFile } = await drive.files.copy({
    auth: this.jwtClient,
    fileId: sourceFile.id,
    supportsAllDrives: true,
    requestBody: {
      ...sourceFile,
      ...docChanges,
      id: null,
      parents: [destinationFolderId],
    },
  })

  return newFile
}

gdrive.prototype.deleteDoc = async function (fileId) {
  if (!fileId) return
  await drive.files.delete({ auth: this.jwtClient, fileId })
}

gdrive.prototype.createFromTemplate = async function (templateDocId, destinationFolderId, name, mergeValues, docChanges = {}) {
  if (!mergeValues) mergeValues = {}

  const newFile = await this.copyDoc(templateDocId, destinationFolderId, {
    name,
    ...docChanges,
  })

  await docs.documents.batchUpdate({
    auth: this.jwtClient,
    documentId: newFile.id,
    resource: {
      requests: buildTextUpdateRequests(mergeValues),
    },
  })

  return newFile
}

const buildTextUpdateRequests = function (payload) {
  var requests = []
  Object.entries(payload).map(key => {
    requests.push({
      replaceAllText: {
        containsText: {
          text: key[0],
          matchCase: true,
        },
        replaceText: key[1] instanceof Array ? key[1].join(',') : key[1],
      },
    })
  })
  return requests
}
