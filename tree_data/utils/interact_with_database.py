import logging
import psycopg2
import psycopg2.extras
import os
import sys
from dotenv import load_dotenv
import geopandas as gpd

def start_db_connection():


    load_dotenv()

    # check if all required environmental variables are accessible
    for env_var in ["PG_DB", "PG_PORT", "PG_USER", "PG_PASS", "PG_DB"]:
        if env_var not in os.environ:
            logging.error("❌Environmental Variable {} does not exist".format(env_var))

    pg_server = os.getenv("PG_SERVER")
    pg_port = os.getenv("PG_PORT")
    pg_username = os.getenv("PG_USER")
    pg_password = os.getenv("PG_PASS")
    pg_database = os.getenv("PG_DB")
   
    dsn = f"host='{pg_server}' port={pg_port} user='{pg_username}' password='{pg_password}' dbname='{pg_database}'"

    try:
        conn = psycopg2.connect(dsn)
        logging.info("🗄 Database connection established")
        print('Connected to DB')
    except:
        logging.error("❌Could not establish database connection")
        conn = None

    return conn


def read_old_tree_data(conn):
    sql = 'SELECT * FROM trees'
    old_trees = gpd.GeoDataFrame.from_postgis(sql, conn, geom_col='geom')
    
    return old_trees
    


#def load_to_db():


def close_db_connection(conn):
    try:
        conn.close()
        print('Closed connection to DB')
    except:
        logging.error("❌Could not close connection to DB")
        conn = None





