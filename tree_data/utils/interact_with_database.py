import logging
import psycopg2
import psycopg2.extras
import os
import sys
# from dotenv import load_dotenv
import geopandas as gpd
from shapely.wkt import dumps
from sqlalchemy import create_engine, select
from sqlalchemy.sql import text
from geoalchemy2 import Geometry, WKTElement
import pandas as pd

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

def start_db_connection():
    """Loads database parameters from a .env-file and connects to the database.

    Raises:
        Exception: Connecting to the database was not sucesfull.

    Returns:
        class 'sqlalchemy.engine.base.Engine': The engine object for connecting to the database.
    """

    # load database parameters from .env
    # load_dotenv()
    # check if all required environmental variables are accessible
    for env_var in ["PGDATABASE", "PGPORT", "PGUSER", "PGPASSWORD", "PGHOST"]:
        if env_var not in os.environ:
            logger.error("❌Environmental Variable {} does not exist".format(env_var))
    # declare variables for database parameters
    pg_host = os.getenv("PGHOST")
    pg_port = os.getenv("PGPORT")
    pg_user = os.getenv("PGUSER")
    pg_password = os.getenv("PGPASSWORD")
    pg_database = os.getenv("PGDATABASE")

    # create databse connection url from variables
    conn_string ="postgresql://"+pg_user+":"+pg_password+"@"+pg_host+":"+pg_port+"/"+pg_database

    # connect to the database
    conn = create_engine(conn_string)
    try:
        # Increase the statement timeout to 0 seconds
        conn.execute("SET statement_timeout TO 120000")
        logger.info("⏰ Statement timeout increased to 120 seconds")

        conn.connect()
        logger.info("🗄  Database connection established")

        return conn
    # stop script if connection to database was not succesfull
    except:
        msg = f"❌ Could not establish a database connection to {conn_string}"
        logger.error(msg)
        raise Exception(msg)

def read_old_tree_data_with_limit_and_offset(conn, database_dict):
    """Load tree data from the database in paginated batches and assemble into a complete DataFrame.

    Args:
        conn (class 'sqlalchemy.engine.base.Engine'): The engine object for connecting to the database.
        database_dict (dict): Dictionary containing database-specific parameters including the table name.

    Returns:
        old_trees (GeoDataFrame): Assembled tree data.
        attribute_list (list): Column names of the old tree data table.
        table_name (str): Name of the table in the database that is used.
    """
    table_name = database_dict['data-table-name']

    # Assuming a standard batch size; adjust as necessary.
    batch_size = 10000
    offset = 0
    has_more_records = True
    full_data = None

    while has_more_records:
        raw_sql = f'SELECT * FROM {table_name} LIMIT {batch_size} OFFSET {offset}'
        logger.info(f'Processing batch with SQL: {raw_sql}')
        # Temporary load of data, adjust for GeoDataFrame construction as necessary, especially the 'geom_col' parameter
        batch = gpd.GeoDataFrame.from_postgis(raw_sql, conn, geom_col='geom')

        # Check if the batch is smaller than the batch_size or empty
        if batch.shape[0] < batch_size:
            has_more_records = False

        if full_data is None:
            full_data = batch
        else:
            full_data = pd.concat([full_data, batch], ignore_index=True)

        offset += batch_size

    # Process the full_data as in your original function
    if full_data is not None:
        attribute_list = full_data.columns.tolist()
        full_data['standortnr'] = full_data['standortnr'].str.split('.').str[0]
        full_data = full_data[['id', 'kennzeich', 'standortnr', 'geom', 'standalter', 'kronedurch', 'stammumfg', 'baumhoehe', 'gmlid']]

        # Log the number of trees processed
        tree_count = len(full_data.index)
        if tree_count > 0:
            logger.info(f"🌳 Loaded old tree data from the Database in batches. The dataset includes {tree_count} trees.")
        else:
            msg = "❌ No trees loaded from the database. Something went wrong."
            logger.error(msg)
            raise Exception(msg)
    else:
        # If no data was loaded
        attribute_list = []
        msg = "❌ No trees loaded from the database. The table might be empty."
        logger.error(msg)
        raise Exception(msg)

    return full_data, attribute_list, table_name

def read_old_tree_data(conn, database_dict):
    """Load currently used "old" tree data from the database to a dataframe.

    Args:
        conn (class 'sqlalchemy.engine.base.Engine'): The engine object for connecting to the database.

    Returns:
        old_trees (GeoDataFrame): Whole tree data that is currently stored in the database.
        attribute_list (list): column names of old tree data table
        table_name (str): name of table in database that will be used
    """

    # get name of table with old data
    table_name = database_dict['data-table-name']
    # create query for selecting the data table with trees
    sql_query = 'SELECT * FROM ' + table_name
    # import data and create dataframe
    old_trees = gpd.GeoDataFrame.from_postgis(sql_query, conn, geom_col='geom')

    # create list with attribute names from the dataset
    attribute_list = old_trees.columns
    print(old_trees.head())
    print(attribute_list)

    # create a duplicated table for testing if replace parameter in config.yml ist set to False
    if database_dict['replace-table'] == False:
        table_name = 'trees_new'
        old_trees.to_postgis(table_name, conn, if_exists='replace')

    # keep only columns that are needed for comparing, merging or checking the data
    old_trees = old_trees[['id','kennzeich','standortnr','geom', 'standalter',
       'kronedurch', 'stammumfg', 'baumhoehe','gmlid']]
    old_trees['standortnr'] = old_trees['standortnr'].str.split('.').str[0]

    # count number of trees
    tree_count = len(old_trees.index)
    if tree_count > 0:
        logger.info("🌳 Loaded old tree data from the Database. The dataset includes " + str(tree_count) + " trees.")
    # stop script if no trees were loaded from the database
    else:
        msg = f"❌  No trees loaded from the database. Something went wrong."
        logger.error(msg)
        raise Exception(msg)

    return old_trees, attribute_list, table_name


def update_db(conn, result, update_attributes_list, table_name):
    """Takes the subset of tree data were updates were found and updates the respective columns in the dataset in the database.

    Args:
        conn (class 'sqlalchemy.engine.base.Engine'): The database engine object returned by start_db_connection().
        result (DataFrame): subset of tree data.
        attribute_list (list): column names of old tree data table
        table_name (str): name of table in database that will be used
    """

    # write updated trees to a new table in database
    result.to_sql('tree_updates_tmp', conn, if_exists='replace', index=False)
    #result.to_postgis('tree_updates_tmp', conn, if_exists='replace')

    # create sql string for updating the needed columns in the old datatable
    set_str = ''
    for attribute in update_attributes_list:
        set_str = set_str + attribute + ' = tree_updates_tmp.' + attribute + ', '
    set_str = set_str[:-2]

    # execute sql query for updating data
    sql = 'UPDATE ' + table_name + ' SET ' + set_str + ' FROM tree_updates_tmp WHERE tree_updates_tmp.id = ' + table_name + '.id'
    conn.execute(sql)
    sql =  'UPDATE ' + table_name + ' SET geom = ST_SetSRID(ST_MakePoint(lat::numeric, lng::numeric), 4326)'
    conn.execute(sql)
    # delete the temporary table
    sql_d = 'DROP TABLE tree_updates_tmp'
    conn.execute(sql_d)

    logger.info("🔄 Sucessfully updated columns " + str(update_attributes_list) + " in data table '" + table_name + "' for " + str(len(result)) + " rows.")


def delete_from_db(conn, result, table_name):
    """Takes the subset of deleted trees and deletes the respective rows in the dataset in the database.

    Args:
        conn (class 'sqlalchemy.engine.base.Engine'): The database engine object returned by start_db_connection().
        result (DataFrame): subset of tree data.
        table_name (str): name of table in database that will be used
    """

    # write deleted trees to a new table in database
    result.to_sql('tree_deleted_tmp', conn, if_exists='replace', index=False)
    try:
        for i, (_, row) in enumerate(result.iterrows(), 1):
            # Delete row from trees_adopted table
            sql = "DELETE FROM trees_adopted WHERE tree_id = '{}'".format(row['id'])
            conn.execute(sql)

            # Delete row from trees_watered table
            sql = "DELETE FROM trees_watered WHERE tree_id = '{}'".format(row['id'])
            conn.execute(sql)

            # Delete row from the specified table
            sql = "DELETE FROM {} WHERE id = '{}'".format(table_name, row['id'])
            conn.execute(sql)

            # Log progress after every 1,000 trees
            if i % 1000 == 0:
                logger.info("⬇️  Deleted {} trees".format(i))

        logger.info("⬇️  Sucessfully deleted " + str(len(result)) + " trees in data table " + table_name + ".")
    except Exception as e:
        logger.info('❌  No trees to delete.')
        logging.exception('Error occurred while adding trees to database: {}'.format(e))

    # delete the temporary table
    sql = 'DROP TABLE tree_deleted_tmp'
    conn.execute(sql)


def add_to_db(conn, result, table_name):
    """Takes the subset of added trees and adds the respective rows to the dataset in the database.

    Args:
        conn (class 'sqlalchemy.engine.base.Engine'): The database engine object returned by start_db_connection().
        result (DataFrame): subset of tree data.
        table_name (str): name of table in database that will be used
    """

    # write added trees to a new table in database
    #result = result.rename(columns={'geometry':'geom'}).set_geometry('geom')
    result['geometry'] = gpd.points_from_xy(result.lat, result.lng)
    result = result.rename(columns={'geometry':'geom'}).set_geometry('geom')
    result.to_postgis('added_trees_tmp', conn, if_exists='replace', index=False)
    try:
        # execute sql query for adding the data
        sql = "UPDATE added_trees_tmp SET geom = ST_SetSRID(geom,4326)"

        # there is a problem with uppercase header names, so we have to bring all column names to "" here
        conn.execute(sql)
        cols = ''
        for c in result.columns:
            cols += '"%s", ' % c
        cols = cols[:-2]

        append_sql = f"INSERT INTO {table_name}({cols}) SELECT * FROM added_trees_tmp"
        conn.execute(append_sql)

        logger.info("⬆️  Sucessfully added " + str(len(result)) + " new trees to the database table '" + table_name + "'.")

    except Exception as e:
        logger.info('❌  No trees to add.')
        logging.exception('Error occurred while adding trees to database: {}'.format(e))

    # delete the temporary table
    sql = 'DROP TABLE added_trees_tmp'
    conn.execute(sql)

def drop_dublicates(conn, table_name):
    """Takes the subset of added trees and adds the respective rows to the dataset in the database.

    Args:
        conn (class 'sqlalchemy.engine.base.Engine'): The database engine object returned by start_db_connection().
        table_name (str): name of table in database that will be used
    """

    #drop all rows that have share an identical gmlid with another row and keep just one of them
    try:
        with conn.begin() as transaction:
            # drop duplicated trees
            count = conn.execute(f"SELECT COUNT(*) FROM (SELECT id, ROW_NUMBER() OVER (partition BY gmlid ORDER BY id) AS rnum FROM {table_name}) t WHERE t.rnum > 1").scalar()
            conn.execute(f"DELETE FROM {table_name} WHERE id IN (SELECT id FROM (SELECT id, ROW_NUMBER() OVER (partition BY gmlid ORDER BY id) AS rnum FROM {table_name}) t WHERE t.rnum > 1)")

            # drop watering records for deleted trees
            conn.execute(f"DELETE FROM trees_watered WHERE tree_id NOT IN (SELECT id FROM {table_name})")

            # drop adoption records for deleted trees
            conn.execute(f"DELETE FROM trees_adopted WHERE tree_id NOT IN (SELECT id FROM {table_name})")

        logger.info(f"⬆️  Successfully dropped {count} trees and corresponding watering and adoption records from the database table '{table_name}'.")
    except Exception as e:
        logger.info('❌  No trees found that share the same gmlid.')
        logging.exception('Error occurred while deleting trees: {}'.format(e))
