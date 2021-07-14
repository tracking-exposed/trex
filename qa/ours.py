import requests
import json

def getVideoId():
    return "XqZsoesa55w"

def getPublicKey():
    return "6t43jZSicgEKo6AEbtNW7c66ZoALAxorrG3SKHsf2JnR"

apiSupported = {
    'getLast': '/api/v1/last/',
    'getLastHome': '/api/v1/home/',
    'getVideoId': '/api/v1/videoId/' + getVideoId(),
    'getRelatedId': '/api/v1/relatedId/' + getVideoId(),
    'getPersonalCSV_home': '/api/v2/personal/'+getPublicKey()+'/home/csv',
    'getPersonalCSV_video': '/api/v2/personal/'+getPublicKey()+'/video/csv',
}

def fetchContentFromApi(apiname):

    print("%s" % apiname)
    # TODO manage remote/production/testing/local server address
    route = 'https://youtube.tracking.exposed' + apiSupported[apiname]
    response = requests.get(route)
    content = json.loads(response.content)
    return content
    # import pdb; pdb.set_trace()
