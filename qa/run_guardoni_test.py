import os
import subprocess

if __name__ == '__main__':

    # run guardoni test
    os.chdir('../methodology')
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
        print('wrongcommand does not exist')
        guardoni_command.extend(['--chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium'])
        subprocess.run(guardoni_command, check=True)

