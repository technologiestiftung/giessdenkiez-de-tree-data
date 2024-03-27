import geopandas as gpd
from owslib.wfs import WebFeatureService
from requests import Request
import os, ssl
from datetime import datetime

currentDay = datetime.now().day
currentMonth = datetime.now().month
currentYear = datetime.now().year

if (not os.environ.get('PYTHONHTTPSVERIFY', '') and
getattr(ssl, '_create_unverified_context', None)):
    ssl._create_default_https_context = ssl._create_unverified_context

def get_wfs(wfs_url, wfs_output_format, outfile_name):

    wfs = WebFeatureService(url=wfs_url)
    layer = list(wfs.contents)[-1]
    params = dict(service='WFS', version="1.0.0", request='GetFeature',
        typeName=layer, outputFormat=wfs_output_format)

    # Parse the URL with parameters
    q = Request('GET', wfs_url, params=params).prepare().url
    print('Request WFS from ' + q)
    # Read data from URL
    data = gpd.read_file(q)

    data.to_file(outfile_name + ".geojson", driver="GeoJSON")
    print('WFS was written to file' + outfile_name + ".geojson")

# set urls to wfs services
wfs_trees_streets = 'https://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/s_wfs_baumbestand'
wfs_trees_parks = 'https://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/s_wfs_baumbestand_an'

# Specify the output Format of the WFS for fetching the data
wfs_output_format = 'text/xml; subtype=gml/3.2.1'

new_trees_streets_filename = "tree_data/data_files/s_wfs_baumbestand_" + str(currentYear) + "-" + str(currentMonth) + "-" + str(currentDay)
new_trees_parks_filename = "tree_data/data_files/s_wfs_baumbestand_an_" + str(currentYear) + "-" + str(currentMonth) + "-" + str(currentDay)

get_wfs(wfs_trees_streets, wfs_output_format, new_trees_streets_filename)
get_wfs(wfs_trees_parks, wfs_output_format, new_trees_parks_filename)
