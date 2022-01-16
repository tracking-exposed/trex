import dotenv from 'dotenv';

const mode = process.env.NODE_ENV === 'production'
  ? 'production' : 'development';

const dotEnvPath = mode === 'production'
  ? '.env' : '.env.development';

let rawConfig: unknown;

try {
  const { parsed } = dotenv.config({
    path: dotEnvPath,
  });
  rawConfig = parsed;
} catch (err) {

}

export default rawConfig;
