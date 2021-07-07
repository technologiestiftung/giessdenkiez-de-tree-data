# Giessdenkiez.de Tree data 

*This is a script to harvest tree data from a Web Feature Service from Berlins Geodata Portal and integrate it to our Gieß-den-Kiez-database.*

In the application [Gieß-den-Kiez.de](https://giessdenkiez.de), Berlin's street trees are displayed on a map. The data about the trees comes from Berlin's street and green space offices and is made available as open data via Berlin's Geodata portal, the [FIS-Broker](https://fbinter.stadt-berlin.de/fb/index.jsp). The underlying database, the green space information system (GRIS), is continuously maintained by the administration: Trees not yet recorded and newly planted trees are entered and felled trees are deleted. The data set is then updated in the Geodata portal once a year, always in spring. In order to reflect the current status, the data in Gieß den Kiez is therefore also updated once a year when the new [tree dataset](https://fbinter.stadt-berlin.de/fb/index.jsp?loginkey=zoomStart&mapId=k_wfs_baumbestand@senstadt&bbox=389138,5819243,390887,5820322) is published.

We use these Python scripts to automate this. Using the script `get_data_from_wfs.py`, the data can be downloaded from the FIS-Broker in GeoJSON format and saved locally. Using `main.py` we connect to our Gieß-den-Kiez database and the data is then compared with the existing tree data of the database using their GML-IDs (also called technical IDs in the FIS-Broker). In this way, deleted and added trees are identified and removed or added from the database. All matching trees are also identified and updated for the columns specified in `config.yml`.

![tree_data_schema](https://user-images.githubusercontent.com/61182572/124777121-44cb3080-df40-11eb-9e49-4cccad77b821.png)

## Inputs 

- New tree data in GML or GeoJSON format
- config.yaml that configurates paths, tablesnames, overwritting, mapping of column names and columns to update
- .env that contains database credentials

## Example Usage

To save newest tree data from the FIS-Broker locally run
```bash
python tree_data/get_data_from_wfs.py
```
To update database run
```bash
python tree_data/main.py
```

