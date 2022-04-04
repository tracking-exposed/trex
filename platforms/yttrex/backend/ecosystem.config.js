module.exports = {
  apps: [
    {
      name: "yt-backend",
      cwd: __dirname,
      script: "yarn watch",
      watch: false,
    },
    {
      name: "yt-leaves-parser",
      cwd: __dirname,
      script: "yarn leaveserv:watch",
      watch: false,
    },
    {
      name: "yt-parser",
      cwd: __dirname,
      script: "yarn parserv:watch",
      watch: false,
    },
  ],
};
