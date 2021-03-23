#import geopandas as gpd
import pandas as pd

from utils.get_new_data import get_wfs, read_new_tree_data
from utils.interact_with_database import start_db_connection, close_db_connection, read_old_tree_data
from utils.process_data import transform_new_tree_data, compare_tree_data


# TO-DO: Create .yaml for variable Input?

# set urls to wfs services
wfs_trees_streets = 'https://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/s_wfs_baumbestand'
wfs_trees_parks = 'https://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/s_wfs_baumbestand_an'
#'https://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/s_bparkplatz'
# Specify the output Format of the WFS for fetching the data
wfs_output_format = 'text/xml; subtype=gml/3.2.1'
new_trees_filename = "tree_data/data_files/s_wfs_baumbestand_an_test.gml"



#get_wfs(wfs_trees_streets, wfs_output_format, 'tree_data/data_files/trees_streets')
#get_wfs(wfs_trees_parks, wfs_output_format, 'tree_data/data_files/trees_parks')
#new_trees = pd.concat([trees_streets, trees_parks])
#new_trees.to_file(new_trees_filename + ".json", driver="GeoJSON")

new_trees = read_new_tree_data(new_trees_filename)


conn = start_db_connection()

old_trees = read_old_tree_data(conn)



print(new_trees.columns)
print(new_trees['namenr'])
print(old_trees.columns)
#print(old_trees['namenr'])

new_trees = transform_new_tree_data(new_trees)
print(new_trees)

print(type(new_trees['standortnr'][1]))

result = compare_tree_data(new_trees, old_trees)
print(result)
# create_updated_tree_df()
# load_to_db()

close_db_connection(conn)


