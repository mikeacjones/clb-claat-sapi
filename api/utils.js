const path = require('path')
const { exec } = require('child_process')
const { promises: fs } = require('fs')

const slugify = text => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
}

const execAsync = async (file, args, opts) => {
  return new Promise((resolve, reject) => {
    exec(`${file} ${args.join(' ')}`, opts, err => {
      if (err) return reject(err)
      else resolve()
    })
  })
}

const uuid = _ => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const getFiles = async (dir, relPath = '') => {
  var files = []

  const dirFiles = await fs.readdir(dir)
  for (var i in dirFiles) {
    var f = dirFiles[i]
    var absolutePath = path.join(dir, f)
    var relativePath = path.join(relPath, f)
    try {
      if ((await fs.stat(absolutePath)).isDirectory()) {
        const subDirFiles = await getFiles(absolutePath, relativePath)
        files = files.concat(subDirFiles)
      } else {
        files.push({
          absolutePath,
          relativePath,
        })
      }
    } catch {}
  }

  return files
}

module.exports = {
  slugify,
  execAsync,
  uuid,
  getFiles,
}
