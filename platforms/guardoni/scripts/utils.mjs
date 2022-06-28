/**
 * Convert the platform name return by `os.type()`
 * to our platform name convention
 */
function normalizePlatform(p) {
  if (p === 'Linux') {
    return 'linux';
  }
  if (p === 'Darwin') {
    return 'mac';
  }
  return 'windows';
}

/**
 * Return the correspondent guardoni cli pkg name
 * based on given version and platform
 */
function getGuardoniCliPkgName(version, p) {
  const commonGuardoniPkgName = `guardoni-cli-${version}`;
  if (p === 'linux') {
    return `${commonGuardoniPkgName}-linux`;
  }
  if (p === 'mac') {
    return `${commonGuardoniPkgName}-macos`;
  }
  return `${commonGuardoniPkgName}.exe`;
}

export { normalizePlatform, getGuardoniCliPkgName };
