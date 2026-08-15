const packageMetadata = require('../package.json')

module.exports = {
  ...packageMetadata.build,
  appId: 'com.minerva.ranger.installer-smoke',
  productName: 'MinervaRangerSmoke',
  artifactName: 'MinervaRangerSmoke Setup ${version}.${ext}',
  extraMetadata: {
    name: 'minerva-ranger-smoke',
    productName: 'MinervaRangerSmoke',
    version: packageMetadata.version,
  },
  directories: {
    ...packageMetadata.build.directories,
    output: 'release/installer-smoke',
  },
}
