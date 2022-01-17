# Taboule

A table component to properly display TRex data provided by generalized API contract.

## Getting Started

**Prerequisites**:

- `node >= 16`
- `yarn >= 3`

Always run `yarn` in the project's root:

```bash
yarn
```

## Development

To start developing `Taboule` just run `yarn watch` - or `yarn taboule watch` from the root - and open [localhost:3002](http://localhost:3002/index.html).

## Build

To produce an optimized bundle for distribution you need to run:

```bash
# use `NODE_ENV=production yarn taboule build` if you run it from root
NODE_ENV=production yarn build
```

## Usage

To include `Taboule` in your project you need to include the `taboule.js` file in `build` in your html, normally it should be copied in `static/js/generated` folder:

```html
<html>
  <body>
    <h2>Taboule</h2>
    <div id="main"></div>
  </body>
  <script type="text/javascript" src="/js/generated/taboule.js"></script>
  <script type="text/javascript">
    var baseURL = 'https://youtube.tracking.exposed/api/';

    window.Taboule({
      showInput: showInput,
      node: document.getElementById('main'),
      baseURL: baseURL,
      query: query,
      pageSize: 25,
      initialParams: {
        channelId: 'your-channel-id',
      },
    });
  </script>
</html>
```
