import geopandas as gpd
import pandas as pd


def transform_new_tree_data(new_trees_streets, new_trees_parks):

    new_trees_streets['type'] = 'strasse'
    new_trees_parks['type'] = 'anlage'

    new_trees = pd.concat([new_trees_streets,new_trees_parks],ignore_index=True)

    #print(new_trees)

    new_trees = new_trees.drop(['fid', 'gml_id',"art_dtsch","art_bot","gattung_de", "eigentueme","namenr","hausnr",'gattung_deutsch', 'gattung', 'strname',
       'zusatz','bezirk', 'eigentuemer','geometry'],axis = 1)
    print(new_trees.columns)
    #new_trees = new_trees.rename(columns={"art_dtsch": "artdtsch", "art_bot": "artBot", "gattung_de": "gattungdeutsch", "eigentueme": "eigentuemer", "geometry": "geom", "namenr": "strname" })
    
   # print(new_trees.columns)
    new_trees['standortnr_2'] = new_trees['kennzeich'].astype(str)
    new_trees['kennzeich'] = new_trees['standortnr'].astype(str)
    new_trees['standortnr'] = new_trees['standortnr_2'].astype(str)
    # new_trees = pd.DataFrame(new_trees)
    new_trees = new_trees.drop(['standortnr_2'], axis=1)
    #new_trees = new_trees.set_geometry("geometry")
    #print(new_trees.crs)
    #new_trees = new_trees.to_crs("EPSG:4326")
    print(new_trees.columns)
    
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
    #old_trees = pd.DataFrame(old_trees)
    new_trees = pd.DataFrame(new_trees)
    old_trees = old_trees.drop(['radolan_days'], axis=1)
    #pd.set_option("display.max_rows", 125, "display.max_columns", 10)
    print("AAAAAAAA")
    assert "standortnr" in old_trees.columns
    #print(old_trees['standortnr'])
    print("BBBBBBBBB")
    assert "standortnr" in new_trees.columns
    print(new_trees['standortnr'])
    
    updated = old_trees.merge(new_trees, on = ['standortnr','kennzeich'], how ='inner')#, how='inner') #125
    print(updated)
    updated['diff_alter']=updated['standalter_y'].astype(int)-updated['standalter_x'].astype(int)
    print(updated['diff_alter'])
    updated.to_file("tree_data/data_files/updated_tmp.json", driver="GeoJSON")
    updated = updated.drop(['lat', 'lng', 'artdtsch', 'artBot', 'gattungdeutsch', 'gattung',
       'strname', 'hausnr', 'zusatz', 'pflanzjahr_x', 'standalter_x',
       'kronedurch_x', 'stammumfg_x', 'type_x', 'baumhoehe_x', 'bezirk',
       'eigentuemer', 'adopted', 'watered', 'radolan_sum', 'geom',
       'standortnr', 'kennzeich', 'caretaker', 'type_y'], axis =1)
    #updated = gpd.GeoDataFrame(updated, geometry='geom')
    print(updated.columns)
    
    #exit()
    
    #deleted_trees = pd.merge(old_trees, new_trees, on = ['standortnr','kennzeich'], how="left")
    #print(deleted_trees)
    # #deleted_trees = deleted_trees.drop(['geom'], axis=1)
    # deleted_trees = old_trees.merge(new_trees, on = ['standortnr','kennzeich'], how='left')
    # #print(deleted_trees)
    # deleted_trees = deleted_trees[deleted_trees['artBot_y'].isnull()]
    # #print(deleted_trees)
    
    # deleted_trees = gpd.GeoDataFrame(deleted_trees, geometry='geometry')
    # #deleted_trees.to_file("tree_data/data_files/deleted_tmp.json", driver="GeoJSON")

    # added_trees = old_trees.merge(new_trees, on = ['standortnr','kennzeich'], how='right')
    # print(added_trees)
    # added_trees = added_trees[added_trees['artBot_x'].isnull()]
    # print(added_trees)
    # added_trees = gpd.GeoDataFrame(added_trees, geometry='geometry')
    #added_trees.to_file("tree_data/data_files/added_tmp.json", driver="GeoJSON")

    


    return updated