/* eslint-disable strict, no-console, object-shorthand */
/* eslint-disable import/no-extraneous-dependencies, import/newline-after-import */
'use strict';

const path = require('path');
const exec = require('child_process').exec;

const webpack = require('webpack');
const autoPrefixer = require('autoprefixer');
const combineLoaders = require('webpack-combine-loaders');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const WebpackNotifierPlugin = require('webpack-notifier');


require('dotenv').load({ silent: true });

const LAST_VERSION = 2;
const packageJSON = require('./package.json');
const NODE_ENV = process.env.NODE_ENV || 'development';
const PRODUCTION = NODE_ENV === 'production';
const DEVELOPMENT = NODE_ENV === 'development';
console.log('NODE_ENV [' + process.env.NODE_ENV + '] Prod:', PRODUCTION, 'Devel: ', DEVELOPMENT);
// const BUILD = require('child_process').execSync('git rev-parse HEAD').toString().trim();

const PATHS = {
    APPS: {
        app: path.resolve(__dirname, 'src/app.js'),
        popup: path.resolve(__dirname, 'src/chrome/popup/index.js'),
        background: path.resolve(__dirname, 'src/chrome/background/index.js'),
    },
    BUILD: path.resolve(__dirname, 'build'),
    DIST: path.resolve(__dirname, 'dist'),
    NODE_MODULES: path.resolve(__dirname, 'node_modules')
};

/** EXTERNAL DEFINITIONS INJECTED INTO APP **/
var DEV_SERVER =  'localhost'
var ENV_DEP_SERVER = DEVELOPMENT ? 'http://' + DEV_SERVER + ':9000' : 'https://youtube.tracking.exposed';
var ENV_DEP_WEB = DEVELOPMENT ? 'http://' + DEV_SERVER + ':1313' : 'https://youtube.tracking.exposed';

const DEFINITIONS = {
    'process.env': {
        DEVELOPMENT: JSON.stringify(DEVELOPMENT),
        NODE_ENV: JSON.stringify(NODE_ENV),
        API_ROOT: JSON.stringify(ENV_DEP_SERVER + '/api/v' + LAST_VERSION + '/'),
        WEB_ROOT: JSON.stringify(ENV_DEP_WEB),
        VERSION: JSON.stringify(packageJSON.version + (DEVELOPMENT ? '-dev' : '')),
        BUILD: "",
        FLUSH_INTERVAL: JSON.stringify(DEVELOPMENT ? 10000 : 20000)
    }
};

/** PLUGINS **/
const PLUGINS = [
    new webpack.DefinePlugin(DEFINITIONS),
    new webpack.NoErrorsPlugin()
];

const PROD_PLUGINS = [
    new webpack.optimize.UglifyJsPlugin({
        compress: {
            screw_ie8: true,
            warnings: false
        },
        output: {
            comments: false
        },
        sourceMap: true
    }),
    new webpack.LoaderOptionsPlugin({
        debug: false,
        minimize: true
    })

    // Add additional production plugins
];

const DEV_PLUGINS = [
    new WebpackNotifierPlugin({
        // My notification daemon displays "critical" messages only.
        // Dunno if this is the case for every Ubuntu machine.
        urgency: 'critical',
        title: 'yttrex',
        contentImage: path.join(__dirname, 'icons', 'yttrex128.png'),
        timeout: 2,
        alwaysNotify: true
    })
];

const EXTRACT_CSS_PLUGIN = new ExtractTextPlugin(
    'styles.css', {
        allChunks: true
    }
);

PLUGINS.push(EXTRACT_CSS_PLUGIN);

if (PRODUCTION) {
    /* PLUGINS.push(...PROD_PLUGINS); firefox is giving me too many problem */
} else if (DEVELOPMENT) {
    console.log('Development, using as environment variables: ' +
        JSON.stringify(DEFINITIONS['process.env']));
    PLUGINS.push(...DEV_PLUGINS);
}

/** LOADERS **/
const JS_LOADER = combineLoaders([
    {
        loader: 'babel',
        query: {
            cacheDirectory: true
        }
    }

    // Add additional JS loaders
]);

const CSS_LOADER = combineLoaders([
    {
        loader: 'css',
        query: {
            sourceMap: true
        }
    },

    { loader: 'postcss' },

    {
        loader: 'sass',
        query: {
            precision: '8', // If you use bootstrap, must be >= 8. See https://github.com/twbs/bootstrap-sass#sass-number-precision
            outputStyle: 'expanded',
            sourceMap: true
        }
    }

    // Add additional style / CSS loaders
]);

// Add additional loaders to handle other formats (ie. images, svg)

const LOADERS = [
    {
        test: /\.jsx?$/,
        exclude: [PATHS.NODE_MODULES],
        loader: JS_LOADER
    }, {
        test: /\.s[ac]ss$/,
        exclude: [PATHS.NODE_MODULES],
        loader: ExtractTextPlugin.extract('style', CSS_LOADER)
    }

    // Add additional loader specifications
];

/** EXPORTED WEBPACK CONFIG **/
const config = {
    entry: PATHS.APPS,

    output: {
        path: PRODUCTION ? PATHS.DIST : PATHS.BUILD,
        filename: '[name].js'
    },

    debug: !PRODUCTION,

    // devtool: PRODUCTION ? '#source-map' : '#inline-source-map',
    devtool: PRODUCTION ? null : '#inline-source-map',

    target: 'web',

    resolve: {
        extensions: ['', '.js', '.jsx'],
        modules: ['node_modules'] // Don't use absolute path here to allow recursive matching
    },

    plugins: PLUGINS,

    module: {
        loaders: LOADERS
    },

    postcss: [autoPrefixer()]
};

module.exports = config;
