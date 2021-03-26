import geopandas as gpd
from owslib.wfs import WebFeatureService
from requests import Request
import warnings
import pandas as pd
import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

def read_new_tree_data(new_trees_filenames):
    """Import the new raw tree data as dataframes from one or more files.  Combine single dataframes to one dataframe, containing all new tree data.

    Args:
        new_trees_filenames (List of strings): The list contains all paths to files with new tree data.Filenames are set in config.yaml.

    Returns:
        GeoDataFrame: Every file is written to a single dataframe
    """

    with warnings.catch_warnings(): 
        warnings.simplefilter('ignore') # gpd.read_file shows a warning due to a problem with the fiona package in the current version. this can be ignored for now.
        new_trees = gpd.GeoDataFrame()
        # load the tree data file by file and concatinate
        for file in new_trees_filenames:
            tmp = gpd.read_file(file)
            new_trees = pd.concat([new_trees,tmp], ignore_index=True)

        # count number of trees
        tree_count = len(new_trees.index)

    if tree_count > 0:
        logger.info("🌳 Loaded new tree data from " + str(len(new_trees_filenames)) + " file/s. The dataset includes " + str(tree_count) + " trees.")

        return new_trees
    # stop script if no trees were loaded from the files
    else:
        msg = f"❌  No trees loaded from the file/s. Something went wrong."
        logger.error(msg)
        raise Exception(msg)

    # new_trees_streets['type'] = 'strasse'
    # new_trees_parks['type'] = 'anlage'

