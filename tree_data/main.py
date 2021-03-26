#import geopandas as gpd
import pandas as pd
import logging
logging.basicConfig()

from utils.get_new_data import get_wfs, read_new_tree_data
from utils.interact_with_database import start_db_connection, close_db_connection, read_old_tree_data, load_to_db, execute_batch
from utils.process_data import transform_new_tree_data, compare_tree_data

#logger = logging.getLogger(__name__)
#logger.setLevel(logging.DEBUG)

# TO-DO: Create .yaml for variable Input?
#logging.warning('Watch out!') 

# set urls to wfs services
#wfs_trees_streets = 'https://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/s_wfs_baumbestand'
#wfs_trees_parks = 'https://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/s_wfs_baumbestand_an'
#'https://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/s_bparkplatz'
# Specify the output Format of the WFS for fetching the data
#wfs_output_format = 'text/xml; subtype=gml/3.2.1'
new_trees_streets_filename = "tree_data/data_files/s_wfs_baumbestand_test.gml"
new_trees_parks_filename = "tree_data/data_files/s_wfs_baumbestand_an_test.gml"



#get_wfs(wfs_trees_streets, wfs_output_format, 'tree_data/data_files/trees_streets_wfs_test')
#exit()
#get_wfs(wfs_trees_parks, wfs_output_format, 'tree_data/data_files/trees_parks')
#new_trees = pd.concat([trees_streets, trees_parks])
#new_trees.to_file(new_trees_filename + ".json", driver="GeoJSON")

new_trees_streets = read_new_tree_data(new_trees_streets_filename)
new_trees_parks = read_new_tree_data(new_trees_parks_filename)


conn = start_db_connection()

old_trees = read_old_tree_data(conn)
print(old_trees.crs)



#print(new_trees.columns)
#print(old_trees)
#print(old_trees['namenr'])

new_trees = transform_new_tree_data(new_trees_streets,new_trees_parks)
#print(new_trees)


updated = compare_tree_data(new_trees, old_trees)


# create_updated_tree_df()
#execute_batch(conn, updated, 'trees_v2', page_size=100)
load_to_db(conn, updated)

#close_db_connection(conn)


