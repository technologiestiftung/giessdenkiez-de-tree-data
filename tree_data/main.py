#import geopandas as gpd
import pandas as pd

from utils.get_new_data import get_wfs, read_new_tree_data


# TO-DO: Create .yaml for variable Input?

# set urls to wfs services
wfs_trees_streets = 'https://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/s_wfs_baumbestand'
wfs_trees_parks = 'https://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/s_wfs_baumbestand_an'
#'https://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/s_bparkplatz'
# Specify the output Format of the WFS for fetching the data
wfs_output_format = 'text/xml; subtype=gml/3.2.1'
new_trees_filename = "tree_data/data_files/new_trees"

# set database connection parameters
# db_name = ''
# user = ''
# password = ''
# host = ''


#get_wfs(wfs_trees_streets, wfs_output_format, 'tree_data/data_files/trees_streets')

get_wfs(wfs_trees_parks, wfs_output_format, 'tree_data/data_files/trees_parks')


#new_trees = pd.concat([trees_streets, trees_parks])
#new_trees.to_file(new_trees_filename + ".json", driver="GeoJSON")

#new_trees = read_new_tree_data(new_trees_filename)

#print(new_trees.head())

#ogr2ogr -f gpkg s_wfs_baumbestand_an.gpkg WFS:"https://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/s_wfs_baumbestand_an" s_wfs_baumbestand_an


# start_db_connection
# read_old_tree_data()
# transform_geometry()
# compare_tree_data()
# create_updated_tree_df()
# load_to_db()
# close_db_connection()


