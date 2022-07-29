# Experiments

The files here are example, they represent a sequence of _Steps_ that Guardoni might execute for you.

From the root directory you can use them with this command:

```
yarn install
yarn build
yarn pm2 start platforms/ecosystem.config.js
yarn guardoni cli yt-register platforms/guardoni/experiments/tiktok-example.csv  --verbose
```

And each example provided in the `experiments` folder represent a different sequence of URL. Try them by changing the URL, the duration of navigation, and keep track of the registered experimentsId so you can replicate the navigation with different profiles.
