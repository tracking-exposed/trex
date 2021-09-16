import requests
import json
import pandas as pd


def fetchContentFromApi(api_request):
    print("%s" % api_request)
    # TODO manage remote/production/testing/local server address
    route = 'https://youtube.tracking.exposed' + api_request
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
        response_file.close()
        # return properly formatted json
        column_names = rows.pop(0)
        df = pd.DataFrame(rows, columns=column_names)
        content = df.to_dict('records')
    return content
