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
import geoalchemy2

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


def start_db_connection():
    """Loads database parameters from a .env-file and connects to the database.

    Raises:
        Exception: Connecting to the database was not successful.

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


def read_old_tree_data(conn):
    """Load currently used "old" tree data from the database to a dataframe.

    Args:
        conn (class 'sqlalchemy.engine.base.Engine'): The engine object for connecting to the database.

    Returns:
        GeoDataFrame: Whole tree data that is currently stored in the database.
    """

    # create query for selecting the data table with trees
    sql_query = 'SELECT * FROM trees'
    # import data and create dataframe
    old_trees = gpd.GeoDataFrame.from_postgis(sql_query, conn, geom_col='geom')

    # keep only columns that are needed for comparing, merging or checking the data
    old_trees = old_trees[['id','kennzeich','standortnr','geom', 'standalter',
       'kronedurch', 'stammumfg', 'baumhoehe']]

    # count number of trees
    tree_count = len(old_trees.index)
    if tree_count > 0:
        logger.info("🌳 Loaded old tree data from the Database. The dataset includes " + str(tree_count) + " trees.")
    # stop script if no trees were loaded from the database
    else:
        msg = f"❌  No trees loaded from the database. Something went wrong."
        logger.error(msg)
        raise Exception(msg)

    # create a duplicated table for testing
    #old_trees.to_postgis('trees_test1', conn, if_exists='replace')
    
    return old_trees
    

def update_db(conn, result):
    """[summary]

    Args:
        conn (class 'sqlalchemy.engine.base.Engine'): The database engine object returned by start_db_connection().
        result ([type]): [description]
    """

    result.to_sql('tree_updates_tmp', conn, if_exists='replace', index=False)
    #result.to_postgis('tree_updates_tmp', conn, if_exists='replace')
    print('########')

    
    #To-Do:
    sql = 'UPDATE trees_test1 SET kronedurch = tree_updates_tmp.kronedurch_y FROM tree_updates_tmp WHERE tree_updates_tmp.id = trees_test1.id'
    rs = conn.execute(sql)

    #sql = 'DROP TABLE tree_updates_tmp'
    #rs = conn.execute(sql)

    # TO-DO: add and delete data


