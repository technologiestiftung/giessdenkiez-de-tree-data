import geopandas as gpd
import pandas as pd
import logging
import numpy as np
import yaml

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

def read_config():
    """Read configuration parameters from the config.yml file.

    Returns:
        new_trees_paths_list (list): paths to new tree data
        schema_mapping_dict (dictionary): mapping for attribute names from old to new data
        update_attributes_list (list): attributes that should be updated
        merge_attribute_list (list): attributes that should be used for merging old and new data tables
        database_dict (dictionary): includes path to databse parameters, name of old data table and configuration for replacing old table
    """

    with open("tree_data/conf.yml", 'r') as stream:
        try:
            conf = yaml.safe_load(stream)
        except yaml.YAMLError as exc:
            logger.error("❌Something is wrong with the config.yaml file.")
            raise 

    new_trees_paths_list = conf['new-data-paths']
    update_attributes_list = conf['data-schema']['update']
    merge_attributes_list = conf['data-schema']['merge-on']
    schema_mapping_dict = conf['data-schema']['mapping']
    database_dict = conf['database']

    return new_trees_paths_list, schema_mapping_dict, update_attributes_list, merge_attributes_list, database_dict

def transform_new_tree_data(new_trees, attribute_list, schema_mapping_dict):
    """Takes the new tree data and extracts the data columns that are needed for comparision with old tree data. Does also change datatypes of some columns.

    Args:
        new_trees (DataFrame): Raw new tree data, as loaded from files by read_tree_data().

    Returns:
        transformed_trees (DataFrame): Extracted tree data.
    """

    # if keeping the geometry column, transform data to the crs of our old tree dataset
    new_trees['geometry'] = new_trees['geometry'].set_crs("EPSG:25833")
    new_trees['geometry'] = new_trees['geometry'].to_crs("EPSG:4326")


    # in our case we don't use the geometry of the new data, so we can transform the geodataframe to a dataframe
    #transformed_trees = pd.DataFrame(new_trees)

    # rename columns based on the columns of the old data
    transformed_trees = new_trees.rename(columns=schema_mapping_dict)

    # drop not needed colums based on the columns of the old data
    for column in transformed_trees.columns:
        if column == "geometry":
            continue
        else:
            if column not in attribute_list:
                transformed_trees = transformed_trees.drop([column], axis = 1)

    # replace NA values with 'undefined' and transform dataformats to string
    for column in transformed_trees.columns:
        if column != "geometry":
            if transformed_trees[column].dtype != object or column == 'kronedurch': # 'kronedurch' is from type object but is loaded to the db as double precision, this is why we have to make this hack here
                transformed_trees[column] = transformed_trees[column].fillna('99999')
                transformed_trees[column] = transformed_trees[column].astype(int).astype(str)
    transformed_trees = transformed_trees.replace(['99999'], 'undefined')
    transformed_trees = transformed_trees.replace('', 'undefined')

    transformed_trees['lng'] = (transformed_trees.geometry.y).astype(str)
    transformed_trees['lat'] = (transformed_trees.geometry.x).astype(str)
 
    # in our current old data, standortnr and kennzeichen are reversed, so we have to reverse it here also
    transformed_trees['standortnr_2'] = transformed_trees['kennzeich']
    transformed_trees['kennzeich'] = transformed_trees['standortnr'].astype(str)
    transformed_trees['standortnr'] = transformed_trees['standortnr_2'].astype(str)
    transformed_trees = transformed_trees.drop(['standortnr_2'], axis=1)

    return transformed_trees
    

def find_updated_trees(transformed_trees, old_trees, update_attributes_list,  merge_attributes_list):

    transformed_trees = pd.DataFrame(transformed_trees)

    # find all trees that exist in old AND in the new dataset
    updated_trees = old_trees.merge(transformed_trees, on = merge_attributes_list, how ='inner', suffixes=("_x", None)) #125

    # count number of updated trees
    tree_count = len(updated_trees.index)
    if tree_count > 0:
        logger.info("🌲 Matched tree datasets: " + str(tree_count) + " matching trees were found.")
    # stop script if no updated trees were found
    else:
        msg = f"❌  No matching trees in old and new dataset were found. Something went wrong."
        logger.error(msg)
        raise Exception(msg)
    
    # Calculate some statistics about the updated attributes
    try:
        logger.info('📶 Some statistics about difference between old and new values of attributes: ')
        for attribute in update_attributes_list:
            mean = (updated_trees[attribute].astype(float)-updated_trees[attribute+'_x'].astype(float)).describe()
            logger.info(attribute + ': mean = ' + str(mean[1]) + ', max = ' + str(mean[7]) + ', min = ' + str(mean[3]))
    except:
        logger.info('❌  No statistics about updated values available.')

    # save subset of updated tree data as geojson file
    #updated_trees.to_file("tree_data/data_files/updated_trees_tmp.json", driver="GeoJSON")

    # delete unused attributes
    updated_trees = updated_trees[update_attributes_list + ['id']]

    return updated_trees


def find_deleted_trees(transformed_trees, old_trees, merge_attributes_list):

    transformed_trees = pd.DataFrame(transformed_trees)

    # find all trees that exist in the old BUT NOT in the new dataset
    deleted_trees = pd.merge(old_trees, transformed_trees, on = merge_attributes_list, how="left")
    deleted_trees = old_trees.merge(transformed_trees, on = merge_attributes_list, how='left')
    deleted_trees = deleted_trees[deleted_trees['baumhoehe_y'].isnull()] # 15

    # count number of deleted trees
    tree_count = len(deleted_trees.index)
    if tree_count > 0:
        logger.info("🌲 Matched tree datasets: " + str(tree_count) + " trees were found that exist in the old BUT NOT in the new dataset.")
    # stop script if no deleted trees were found
    else:
        msg = f"🌲 No deleted trees were found."
        logger.error(msg)
 
    # save subset of deleted tree data as geojson file
    # deleted_trees.to_file("tree_data/data_files/deleted_tmp.json", driver="GeoJSON")

    # delete unused attributes
    deleted_trees = deleted_trees[['id']]

    return deleted_trees


def find_added_trees(transformed_trees, old_trees, merge_attributes_list):

    # only keep needed columns from old trees
    old_trees = old_trees[['id']+ merge_attributes_list]
    
    # find all trees that which does not exist in the old BUT IN the new dataset
    added_trees = old_trees.merge(transformed_trees, on = merge_attributes_list, how='right')

    added_trees = added_trees[added_trees['id'].isnull()] #210
    added_trees = gpd.GeoDataFrame(added_trees, geometry=added_trees['geometry'])

    # create id's for new trees
    id_str = ""
    for i, column in enumerate(merge_attributes_list):
        id_str += "_" + added_trees[merge_attributes_list[i]]
    added_trees['id'] = id_str

    #count number of added trees
    tree_count = len(added_trees.index)
    if tree_count > 0:
        logger.info("🌲 Matched tree datasets: " + str(tree_count) + " trees were found that do not exist in the old BUT IN in the new dataset.") 
    # stop script if no addedtrees were found
    else:
        msg = f"🌳  No added trees were found."
        logger.error(msg)

    # save subset of added tree data as geojson file
    #added_trees.to_file("tree_data/data_files/added_tmp.json", driver="GeoJSON")

    return added_trees


def compare_tree_data(transformed_trees, old_trees, update_attributes_list,  merge_attributes_list):
    """Compare the old and the new tree data to find changes.

    Args:
        transformed_trees (DataFrame): New preprocessed tree data.
        old_trees (DataFrame): Old preprocessed tree data.
        update_attributes_list (list): attributes that should be updated
        merge_attribute_list (list): attributes that should be used for merging old and new data tables

    Returns:
        updated_trees [DataFrame]: Subset of updated tree data.
        deleted_trees [DataFrame]: Subset of deleted tree data.
        added_trees [DataFrame]: Subset of added tree data.

    """

    deleted_trees = find_deleted_trees(transformed_trees, old_trees, merge_attributes_list)

    added_trees = find_added_trees(transformed_trees, old_trees, merge_attributes_list)

    updated_trees = find_updated_trees(transformed_trees, old_trees, update_attributes_list, merge_attributes_list)
 
    return updated_trees, deleted_trees, added_trees