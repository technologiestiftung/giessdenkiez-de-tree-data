import geopandas as gpd
import pandas as pd
import logging
import numpy as np

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

def transform_new_tree_data(new_trees):
    """Takes the new tree data and extracts the data columns that are needed for comparision with old tree data. Does also change datatypes of some columns.

    Args:
        new_trees (DataFrame): Raw new tree data, as loaded from files by read_tree_data().

    Returns:
        transformed_trees (DataFrame): Extracted tree data.
    """

    # if keeping the geometry column, transform data to the crs of our old tree dataset
    #transformed_trees = transformed_trees.to_crs("EPSG:4326")

    # in our case we don't use the geometry of the new data, so we can transform the geodataframe to a dataframe
    transformed_trees = pd.DataFrame(new_trees)

    # only keep the needed data columns
    transformed_trees = new_trees.drop(['fid', 'gml_id',"art_dtsch","art_bot","gattung_de", "eigentueme","namenr","hausnr",'gattung_deutsch', 'gattung', 'strname',
       'zusatz','bezirk', 'eigentuemer','geometry','pflanzjahr'],axis = 1)

    # replace NA values with 'undefined' and transform dataformats to string
    for column in transformed_trees.columns:
        if isinstance(transformed_trees[column][0],str) == False:
            transformed_trees[column] = transformed_trees[column].fillna('99999')
            transformed_trees[column] = transformed_trees[column].astype(int).astype(str)
    transformed_trees = transformed_trees.replace(['99999'], 'undefined')
    transformed_trees = transformed_trees.replace('', 'undefined')
 
    # in our current old data, standortnr and kennzeichen are reversed, so we have to reverse it here also
    transformed_trees['standortnr_2'] = transformed_trees['kennzeich']
    transformed_trees['kennzeich'] = transformed_trees['standortnr'].astype(str)
    transformed_trees['standortnr'] = transformed_trees['standortnr_2'].astype(str)
    transformed_trees = transformed_trees.drop(['standortnr_2'], axis=1)

    return transformed_trees
    
    
def compare_tree_data(transformed_trees, old_trees):
    """[summary]

    Args:
        transformed_trees ([type]): [description]
        old_trees ([type]): [description]

    Returns:
        [type]: [description]
    """

    # find all trees that exist in old AND in the new dataset
    updated_trees = old_trees.merge(transformed_trees, on = ['standortnr','kennzeich'], how ='inner') #125

    # count number of updated trees
    tree_count = len(updated_trees.index)
    if tree_count > 0:
        logger.info("🌳 Matched old and new tree datasets. " + str(tree_count) + " matching trees were found. They were saved for updating the data.")
    # stop script if no updated trees were found
    else:
        msg = f"❌  No matching trees in old and new dataset were found. Something went wrong."
        logger.error(msg)
        raise Exception(msg)
    
    # Calculate some statistics about the updated attributes
    try:
        logger.info('📶 Some statistics about difference between old and new values of attributes: ')
        for attribute in ['standalter','kronedurch','baumhoehe','stammumfg']:
            mean = (updated_trees[attribute+'_y'].astype(float)-updated_trees[attribute+'_x'].astype(float)).describe()
            logger.info('📶 ' + attribute + ': mean = ' + str(mean[1]) + ' ,max = ' + str(mean[7]) + ' ,min = ' + str(mean[3]))
    except:
        logger.info('❌  No statistics about updated values available.')

    # save subset of updated tree data as geojson file
    #updated_trees.to_file("tree_data/data_files/updated_trees_tmp.json", driver="GeoJSON")

    # delete unused attributes
    updated_trees = updated_trees.drop(['standalter_x',
       'kronedurch_x', 'stammumfg_x', 'baumhoehe_x', 
       'standortnr', 'kennzeich','geom'], axis=1)


    # find all trees that exist in the old BUT NOT in the new dataset
    deleted_trees = pd.merge(old_trees, transformed_trees, on = ['standortnr','kennzeich'], how="left")
    deleted_trees = old_trees.merge(transformed_trees, on = ['standortnr','kennzeich'], how='left')
    deleted_trees = deleted_trees[deleted_trees['baumhoehe_y'].isnull()] # 15

    # count number of deleted trees
    tree_count = len(deleted_trees.index)
    if tree_count > 0:
        logger.info("🌳 Matched old and new tree datasets. " + str(tree_count) + " trees were found that exist in the old BUT NOT in the new dataset. They were saved for beeing deleted from the database.")
    # stop script if no deleted trees were found
    else:
        msg = f"🌳 No deleted trees were found."
        logger.error(msg)
        raise Exception(msg)
 
    # save subset of deleted tree data as geojson file
    # deleted_trees.to_file("tree_data/data_files/deleted_tmp.json", driver="GeoJSON")

    # delete unused attributes
    deleted_trees = deleted_trees[['id']]
 

    # find all trees that which does not exist in the old BUT IN the new dataset
    added_trees = old_trees.merge(transformed_trees, on = ['standortnr','kennzeich'], how='right')
    added_trees = added_trees[added_trees['baumhoehe_x'].isnull()] #210

    #count number of added trees
    tree_count = len(added_trees.index)
    if tree_count > 0:
        logger.info("🌳 Matched old and new tree datasets. " + str(tree_count) + " trees were found that do not exist in the old BUT IN in the new dataset. They were saved for beein added to the database.")
    # stop script if no addedtrees were found
    else:
        msg = f"🌳  No added trees were found."
        logger.error(msg)
        raise Exception(msg)

    # save subset of added tree data as geojson file
    added_trees.to_file("tree_data/data_files/added_tmp.json", driver="GeoJSON")


    return updated_trees, deleted_trees, added_trees