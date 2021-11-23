import aliasModuleLoader = require('module');
import { statSync } from 'fs';
import { resolve, dirname } from 'path';

const fileExists = (path: string) => {
  try {
    const stat = statSync(path);
    return stat.isFile();
  } catch (e) {
    return false;
  }
};

const findFileInHierarchy = (candidateFolder: string, fileName: string) => {
  const candidateFile = resolve(candidateFolder, fileName);
  if (fileExists(candidateFile)) {
    return candidateFile;
  }
  const parent = resolve(candidateFolder, '..');
  if (parent === candidateFolder) {
    return null;
  }
  return findFileInHierarchy(parent, fileName);
};

const tsConfigPath = findFileInHierarchy(__dirname, 'tsconfig.json');

const cOptions: any = require(tsConfigPath).compilerOptions;

(<any>aliasModuleLoader)._originalResolveFilename = (<any>aliasModuleLoader)._resolveFilename;
(<any>aliasModuleLoader)._resolveFilename = (request: string, parent: aliasModuleLoader, isMain: boolean) => {
  const reply = (path: string) =>
    (<any>aliasModuleLoader)._originalResolveFilename(path, parent, isMain);

  for (const toReplace of Object.keys(cOptions.paths)) {
    const regExp = new RegExp(`^${toReplace.replace(/\*/, '(.*)')}`);
    if (request.match(regExp)) {
      const [replaceWithRelative] = cOptions.paths[toReplace];
      const replaceWithAbsolute = resolve(
        dirname(tsConfigPath),
        cOptions.baseUrl,
        replaceWithRelative
      );

      const replacement = replaceWithAbsolute.replace('*', 'build/$1');
      const newRequest = request.replace(regExp, replacement);
      return reply(newRequest);
    }
  }
  return reply(request);
}
