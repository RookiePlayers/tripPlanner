module.exports = {
  branches: ['main', 
    {
      "name": 'staging',
      "prerelease": 'staging',
    },
    {
      "name": 'develop',
      "prerelease": 'develop',
    }
  ],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/npm',
      {
        npmPublish: false
      }
    ],
    '@semantic-release/changelog',
    [
      '@semantic-release/git',  
      {
        "assets": ["package.json", "CHANGELOG.md"],
        "message": "chore(release): ${nextRelease.version} [skip ci]"
      }
    ],
    '@semantic-release/github'
  ]
};