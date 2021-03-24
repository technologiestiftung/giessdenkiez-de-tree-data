import logging
import psycopg2
import psycopg2.extras
import os
import sys
from dotenv import load_dotenv
import geopandas as gpd
from shapely.wkt import dumps

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
    


def execute_batch(conn, df, table, page_size=100):
    """
    Using psycopg2.extras.execute_batch() to insert the dataframe
    """
    # Create a list of tupples from the dataframe values
    #tuples = [tuple(x) for x in df.to_numpy()]
    tuples = []
    for index, row in df.iterrows():
        tuples.append([row.lat, row.artBot_x])
    print(tuples)
    # Comma-separated dataframe columns
    cols = ','.join(['artBot','lat'])
    # SQL quert to execute
    query  = "INSERT INTO %s(%s) VALUES(%%s,%%s)" % (table, cols)
    cursor = conn.cursor()
    try:
        print('here')
        psycopg2.extras.execute_batch(cursor, query, tuples, page_size)
        conn.commit()
    except (Exception, psycopg2.DatabaseError) as error:
        print("Error: %s" % error)
        conn.rollback()
        cursor.close()
        return 1
    print("execute_batch() done")
    cursor.close()

def load_to_db(conn, result):

    result.to_sql('trees_v22', conn, if_exists='replace')

    # sql = """
    #     CREATE TABLE trees (
    #     id text PRIMARY KEY,
    #     lat text,
    #     lng text,
    #     artdtsch text,
    #     "artBot" text,
    #     gattungdeutsch text,
    #     gattung text,
    #     strname text,
    #     hausnr text,
    #     zusatz text,
    #     pflanzjahr text,
    #     standalter text,
    #     kronedurch text,
    #     stammumfg text,
    #     type text,
    #     baumhoehe text,
    #     bezirk text,
    #     eigentuemer text,
    #     adopted text,
    #     watered text,
    #     radolan_sum integer,
    #     radolan_days integer[],
    #     geom geometry,
    #     standortnr text,
    #     kennzeich text,
    #     caretaker text
    #     )"""
    cur = conn.cursor()
    cur.execute(sql)
    cur.close()
    conn.commit()

def close_db_connection(conn):
    try:
        conn.close()
        print('Closed connection to DB')
    except:
        logging.error("❌Could not close connection to DB")
        conn = None





