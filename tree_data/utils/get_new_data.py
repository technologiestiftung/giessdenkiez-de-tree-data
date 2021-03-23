import geopandas as gpd
from owslib.wfs import WebFeatureService
from requests import Request

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

    data.to_file(outfile_name + ".json", driver="GeoJSON")
    print('WFS was written to file' + outfile_name + ".json")


def read_new_tree_data(new_trees_filename):
    new_trees = gpd.read_file(new_trees_filename)
    return new_trees


#ogr2ogr -f gpkg s_wfs_baumbestand_an.gpkg WFS:"https://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/s_wfs_baumbestand_an" s_wfs_baumbestand_an

#ogr2ogr -f gpkg s_wfs_baumbestand_an.gpkg WFS:"https://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/s_bparkplatz" s_wfs_baumbestand_an