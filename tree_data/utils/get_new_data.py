import geopandas as gpd
from owslib.wfs import WebFeatureService
from requests import Request
import warnings

def read_new_tree_data(new_trees_filenames):

   # with warnings.catch_warnings(): 
        #warnings.simplefilter('ignore') # gpd.read_file shows a warning due to a problem with the fiona package in the current version. this can be ignored for now.
        for file in new_trees_filenames:
            yield gpd.read_file(file)



