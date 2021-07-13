import requests
import json

apiSupported = {
    'last': '/api/v1/last/'
}

def fetchContentFromApi(apiname):

    print(apiname)
    # TODO manage remote/production/testing/local server address
    route = 'https://youtube.tracking.exposed' + apiSupported[apiname]
    response = requests.get(route)
    return json.loads(response.content)
    # import pdb; pdb.set_trace()
