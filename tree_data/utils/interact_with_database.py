import logging
import psycopg2
import psycopg2.extras
import os
import sys
from dotenv import load_dotenv
import geopandas as gpd
from shapely.wkt import dumps
from sqlalchemy import create_engine
from sqlalchemy.sql import text
from geoalchemy2 import Geometry, WKTElement

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
    load_dotenv()
    # check if all required environmental variables are accessible
    for env_var in ["PG_DB", "PG_PORT", "PG_USER", "PG_PASS", "PG_DB"]:
        if env_var not in os.environ:
            logger.error("❌Environmental Variable {} does not exist".format(env_var))
    # declare variables for database parameters
    pg_server = os.getenv("PG_SERVER")
    pg_port = os.getenv("PG_PORT")
    pg_username = os.getenv("PG_USER")
    pg_password = os.getenv("PG_PASS")
    pg_database = os.getenv("PG_DB")

    # create databse connection url from variables
    conn_string ="postgresql://"+pg_username+":"+pg_password+"@"+pg_server+":"+pg_port+"/"+pg_database

    # connect to the database
    conn = create_engine(conn_string)
    try:
        conn.connect()
        logger.info("🗄  Database connection established")

        return conn
    # stop script if connection to database was not succesfull
    except:
        msg = f"❌ Could not establish a database connection to {conn_string}"
        logger.error(msg)
        raise Exception(msg)


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
    sql = 'UPDATE ' + table_name + ' SET ' + set_str + ' FROM tree_updates_tmp WHERE tree_updates_tmp.gmlid = ' + table_name + '.gmlid'
    rs = conn.execute(sql)
    sql =  'UPDATE ' + table_name + ' SET geom = ST_SetSRID(ST_MakePoint(lat::numeric, lng::numeric), 4326)'
    rs = conn.execute(sql)
    # delete the temporary table
    sql_d = 'DROP TABLE tree_updates_tmp'
    rs = conn.execute(sql_d)

    logger.info("🔄 Sucessfully updated columns " + str(update_attributes_list) + " in data table '" + table_name + "' for " + str(len(result)) + " rows.")


def delete_from_db(conn, result, update_attributes_list, table_name):
    """Takes the subset of deleted trees and deletes the respective rows in the dataset in the database.

    Args:
        conn (class 'sqlalchemy.engine.base.Engine'): The database engine object returned by start_db_connection().
        result (DataFrame): subset of tree data.
        attribute_list (list): column names of old tree data table
        table_name (str): name of table in database that will be used
    """

    # write deleted trees to a new table in database
    result.to_sql('tree_deleted_tmp', conn, if_exists='replace', index=False)
    try:
        sql = "DELETE from trees_adopted WHERE tree_id IN " + str(tuple(result['id']))
        rs = conn.execute(sql)
        sql = "DELETE from trees_watered WHERE tree_id IN " + str(tuple(result['id']))
        rs = conn.execute(sql)

        # execute sql query for deleting data
        sql = "DELETE from " + table_name + " WHERE id IN " + str(tuple(result['id']))
        rs = conn.execute(sql)

        logger.info("⬇️  Sucessfully deleted " + str(len(result)) + " trees in data table " + table_name + ".")
    except:
        logger.info('❌  No trees to delete.')

    # delete the temporary table
    sql = 'DROP TABLE tree_deleted_tmp'
    rs = conn.execute(sql)




def add_to_db(conn, result, update_attributes_list, table_name):
    """Takes the subset of added trees and adds the respective rows to the dataset in the database.

    Args:
        conn (class 'sqlalchemy.engine.base.Engine'): The database engine object returned by start_db_connection().
        result (DataFrame): subset of tree data.
        attribute_list (list): column names of old tree data table
        table_name (str): name of table in database that will be used
    """

    # write added trees to a new table in database
    result = result.rename(columns={'geometry':'geom'}).set_geometry('geom')
    result.to_postgis('added_trees_tmp', conn, if_exists='replace', index=False)

    try:
        # execute sql query for adding the data
        sql = "UPDATE added_trees_tmp SET geom = ST_SetSRID(geom,4326)"
        
        # there is a problem with uppercase header names, so we have to bring all column names to "" here
        rs = conn.execute(sql)
        cols = ''
        for c in result.columns:
            cols += '"%s", ' % c
        cols = cols[:-2]
        
        append_sql = f"INSERT INTO {table_name}({cols}) SELECT * FROM added_trees_tmp"
        conn.execute(append_sql)

        logger.info("⬆️  Sucessfully added " + str(len(result)) + " new trees to the database table '" + table_name + "'.")

    except:
        logger.info('❌  No trees to add.')


    # delete the temporary table
    sql = 'DROP TABLE added_trees_tmp'
    rs = conn.execute(sql)
