import geopandas as gpd
import pandas as pd


def transform_new_tree_data(new_trees):

    # Anlagenbäume
    new_trees = new_trees.drop(['fid', 'gml_id',],axis = 1)
    new_trees = new_trees.rename(columns={"art_dtsch": "artdtsch", "art_bot": "artBot", "gattung_de": "gattungdeutsch", "eigentueme": "eigentuemer", "geometry": "geom", "namenr": "strname" })
    new_trees['type'] = 'anlage'

    new_trees['standortnr'] = new_trees['standortnr'].astype(int).astype(str)
    new_trees['kennzeich'] = new_trees['kennzeich'].astype(int).astype(str)
    
    return new_trees

# geometry?
    

#       ['id', 'lat', 'lng', 
#         'hausnr', 'zusatz', 
#       'adopted', 'watered', 'radolan_sum', 'radolan_days', 'caretaker']

    # new_trees['pflanzjahr'] = new_trees['pflanzjahr'] .fillna('99999')
    # new_trees['standalter'] = new_trees['standalter'] .fillna('99999')
    # new_trees['baumhoehe'] = new_trees['baumhoehe'] .fillna('99999')
    # new_trees['kronedurch'] = new_trees['kronedurch'] .fillna('99999')
    # new_trees['hausnr'] = new_trees['hausnr'] .fillna('99999')
    # new_trees['zusatz'] = new_trees['zusatz'] .fillna('99999')
    # new_trees['stammumfg'] = new_trees['stammumfg'] .fillna('99999')


    # new_trees['pflanzjahr'] = new_trees['pflanzjahr'].astype(int).astype(str)
    # new_trees['standalter'] = new_trees['standalter'].astype(int).astype(str)
    # new_trees['kronedurch'] = new_trees['kronedurch'].astype(int).astype(str)
    # new_trees['baumhoehe'] = new_trees['baumhoehe'].astype(int).astype(str)
    # new_trees['baumhoehe'] = new_trees['baumhoehe'].astype(int).astype(str)
    # new_trees['stammumfg'] = new_trees['stammumfg'].replace(['99999'], 'NaN')
    # new_trees = new_trees.replace(['99999'], 'undefined')

    # print(newtrees['pflanzjahr'])
    # print(newtrees.replace('', 'undefined'))
    
    
def compare_tree_data(new_trees, old_trees):
    
    result = pd.merge(new_trees, old_trees, on = ['standortnr', 'kennzeich'])
    return result