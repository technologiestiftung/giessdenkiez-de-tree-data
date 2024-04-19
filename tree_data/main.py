import logging
import time
from utils.get_new_data import read_new_tree_data
from utils.interact_with_database import start_db_connection, read_old_tree_data_with_limit_and_offset, read_old_tree_data, update_db, delete_from_db, add_to_db, drop_dublicates
from utils.process_data import read_config, transform_new_tree_data, compare_tree_data

# logger configuration
logger = logging.getLogger('root')
# FORMAT = "[%(asctime) %(name) %(levelname) - %(funcName)20s() ] %(message)s"
FORMAT = "[%(levelname)s %(name)s] %(message)s"
logging.basicConfig(format=FORMAT)
logger.setLevel(logging.INFO)

# Start timer
start = time.time()

# Read parameters from config.yaml
new_trees_paths_list, schema_mapping_dict, update_attributes_list, merge_attributes_list, database_dict, year = read_config()

# Connect to the database. Database parameters are set in the .env
conn = start_db_connection()
# Import the current tree data from database. Name of the table is set in config.yaml
old_trees, attribute_list, table_name = read_old_tree_data_with_limit_and_offset(conn, database_dict)

# Import raw tree data as dataframe from files. Filenames are set in config.yaml
new_trees = read_new_tree_data(new_trees_paths_list)
# Transform new tree data to needed schema/format.
transformed_trees = transform_new_tree_data(new_trees, attribute_list, schema_mapping_dict)

# Compare new tree data with old tree data and save new, updated and deleted tree data.
#updated_trees= compare_tree_data(transformed_trees, old_trees, update_attributes_list, merge_attributes_list)
updated_trees, deleted_trees, added_trees = compare_tree_data(transformed_trees, old_trees, update_attributes_list, merge_attributes_list, year)

# Bring tree data changes to the database by updating the current tree table.
logger.info("Updating database...")
update_db(conn, updated_trees, update_attributes_list, table_name)
logger.info("Deleting old trees from database...")
delete_from_db(conn, deleted_trees, table_name)
logger.info("Adding new trees to database...")
add_to_db(conn, added_trees, table_name)
#logger.info("Dropping gmlid dublicates...")
#drop_dublicates(conn, table_name)

end = time.time() - start
logger.info("It took {} seconds to run the script".format(end))
