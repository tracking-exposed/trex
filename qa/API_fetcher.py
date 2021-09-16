import requests
import json
import pandas as pd


def getVideoId():
    return "XqZsoesa55w"

def getPublicKey():
    return "6t43jZSicgEKo6AEbtNW7c66ZoALAxorrG3SKHsf2JnR"


def getMetadataId():
    return "TODO"


apiSupported = {
    'getLast': '/api/v1/last/',
    'getLastHome': '/api/v1/home/',
    'getVideoId': '/api/v1/videoId/' + getVideoId(),
    'getRelatedId': '/api/v1/related/' + getVideoId(),
    'getPersonalCSV_home': '/api/v2/personal/'+getPublicKey()+'/home/csv',
    'getPersonalCSV_video': '/api/v2/personal/'+getPublicKey()+'/video/csv',
    'listGuardoniExperiements': '/api/v2/guardoni/list',
    'unitById': 'api/v1/html/' + getMetadataId()  # TODO for test, get metadataId from getLastHome
}

def fetchContentFromApi(apiname):
    print("%s" % apiname)
    # TODO manage remote/production/testing/local server address
    route = 'https://youtube.tracking.exposed' + apiSupported[apiname]
    response = requests.get(route)
    try:
        content = json.loads(response.content)
    # some API return CSV file instead of json
    except:
        import csv
        import pandas
        # bytes need to be written to file
        file_name = '/tmp/API_test_response'
        response_file = open(file_name, 'wb')
        response_file.write(response.content)
        response_file.close()
        # then open to decode csv
        response_file = open(file_name, 'r', encoding='utf-8')
        # skipinitialspace to skip comas within string https://stackoverflow.com/a/8311951/5089456
        rows = list(csv.reader(response_file, skipinitialspace=True))
        # return properly formatted json
        column_names = rows.pop(0)
        df = pd.DataFrame(rows, columns=column_names)
        content = df.to_json()
    return content
    # import pdb; pdb.set_trace()
