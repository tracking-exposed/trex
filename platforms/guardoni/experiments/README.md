# Experiments

The files here are example, they represent a sequence of _Steps_ that Guardoni might execute for you.

From the root directory you can use them with this command:

```
yarn install
yarn build
yarn pm2 start platforms/ecosystem.config.js
cd platforms/guardoni
yarn cli tk-register platforms/guardoni/experiments/tiktok-example.csv  --verbose
```

The last command is registering an experiment for tiktok tracking exposed backend, that listen in TCP PORT 14000.

To register an experiment in the youtube tracking exposed backend, use:

```
yarn cli yt-register platforms/guardoni/experiments/yt-videos.csv  --verbose
```

Which listen in TCP PORT 9000.

Once an experiment is registered you'll get an `experimentId`:

And each example provided in the `experiments` folder represent a different sequence of URL. Try them by changing the URL, the duration of navigation, and keep track of the registered experimentsId so you can replicate the navigation with different profiles.
