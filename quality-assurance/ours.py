import requests
import json

def getVideoId():
    return "XqZsoesa55w"

apiSupported = {
    'getLast': '/api/v1/last/',
    'getLastHome': '/api/v1/home/',
    'getVideoId': '/api/v1/videoId/' + getVideoId()
}

def fetchContentFromApi(apiname):

    print(apiname)
    # TODO manage remote/production/testing/local server address
    route = 'https://youtube.tracking.exposed' + apiSupported[apiname]
    response = requests.get(route)
    print(json.loads(response.content))
    return json.loads(response.content)
    # import pdb; pdb.set_trace()
