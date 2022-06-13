---
title: Test
---

We ensure the stability and the compatibility of `guardoni` with different strategies.

## Jest tests

`jest` is the actual standard to test _javascript_ projects and we use it to manage all the tests in our _monorepo_.

To run tests only for guardoni:

```bash
yarn guardoni test
```

### Bash scripts

Sometimes, during the development, we need to mimic a flow using the _CLI_ previously built and perform some actions like register the experiment csv and run the experiment.

For this purpose there are two different scripts located at `platforms/guardoni/scripts` that performs the above flow for a specific platform:

```bash
cd ./platforms/guardoni
# run test for youtube platform
./scripts/cli-yt-test.sh
# run test for titkok platform
./scripts/cli-tk-test.sh
```
