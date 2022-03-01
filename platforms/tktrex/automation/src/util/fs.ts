import fs from 'fs';
import { cp, readdir, stat } from 'fs/promises';
import { join } from 'path';

/**
 * Copy the files (not the directories)
 * from the source directory to the destination directory.
 *
 * Does not recurse.
 */
export const flatCopyFiles = async(
  srcDirectory: string,
  dstDirectory: string,
): Promise<void> => {
  const files = await readdir(srcDirectory, { withFileTypes: true });

  const promises = files
    .filter((file) => file.isFile())
    .map((file) => {
      const srcPath = join(srcDirectory, file.name);

      const dstPath = join(dstDirectory, file.name);

      return cp(srcPath, dstPath);
    });

  await Promise.all(promises);
};

export const fileExists = async(path: string): Promise<boolean> => {
  try {
    await stat(path);
    return true;
  } catch (e) {
    return false;
  }
};

export const isEmptyDirectoryOrDoesNotExist = async(
  path: string,
): Promise<true | 'not-a-directory' | 'directory-not-empty'> => {
  try {
    const stats = await stat(path);

    if (!stats.isDirectory()) {
      return 'not-a-directory';
    }

    const entries = await fs.promises.readdir(path);

    if (entries.length > 0) {
      return 'directory-not-empty';
    }

    return true;
  } catch (e) {
    return true;
  }
};
