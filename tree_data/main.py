import logging

from utils.get_new_data import read_new_tree_data
from utils.interact_with_database import start_db_connection, read_old_tree_data, load_to_db, execute_batch
from utils.process_data import transform_new_tree_data, compare_tree_data

logging.basicConfig()
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


# TO-DO: Create .yaml for variable Input?


new_trees_streets_filename = "tree_data/data_files/s_wfs_baumbestand_test.gml"
new_trees_parks_filename = "tree_data/data_files/s_wfs_baumbestand_an_test.gml"

#####

# Connect to the database. Database parameters are set in the .env
conn = start_db_connection()
# Import the current tree data from database. Name of the table is set in config.yaml
old_trees = read_old_tree_data(conn)


# Import raw tree data as dataframe from files. Filenames are set in config.yaml
new_trees_streets, new_trees_parks = read_new_tree_data([new_trees_streets_filename, new_trees_parks_filename])
# Transform new tree data to needed schema/format.
new_trees = transform_new_tree_data(new_trees_streets, new_trees_parks)


# Compare new tree data with old tree data and save new, updated and deleted tree data.
updated = compare_tree_data(new_trees, old_trees)
# Bring changes to the database by updating the current tree table.
load_to_db(conn, updated)



