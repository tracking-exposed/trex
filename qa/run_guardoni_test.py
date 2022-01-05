import os
import subprocess

if __name__ == '__main__':

    # run guardoni test
    os.chdir('../guardoni')
    # forge the command to start guardoni script
    guardoni_command = [
                        'src/guardoni.js',
                        '--source', '../qa/tests/guardoni_test_input.json',
                        '--profile', 'guardoniTest',
                        '--experiment', 'guardoniDaily']
    try:
        subprocess.run(guardoni_command, check=True)

    # This exception ensures that the chromium executable can be found when test are ran on OSX
    except subprocess.CalledProcessError:
        print('error with chromium, trying again with hardcoded browser path')
        guardoni_command.extend(['--chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium'])
        subprocess.run(guardoni_command, check=True)
        # TODO query API and check that the data corresponding to this experiment has been recorded
