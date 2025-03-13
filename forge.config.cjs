require('dotenv').config({ path: '.env' })

module.exports = {
  packagerConfig: {
    icon: './resources/race_car_256x256',
    ignore: [
      /^\/src/,
      /(.eslintrc.json)|(.gitignore)|(electron.vite.config.ts)|(forge.config.cjs)|(tsconfig.*)/
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        icon: './resources/race_car_256x256.ico',
        setupIcon: './resources/race_car_256x256.ico'
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin']
    },
    {
      name: '@electron-forge/maker-deb',
      config: {}
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {}
    }
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: process.env.REPOSITORY_OWNER,
          name: process.env.REPOSITORY_NAME,
          authToken: process.env.GITHUB_TOKEN
        },
        prerelease: false,
        draft: true
      }
    }
  ]
}
