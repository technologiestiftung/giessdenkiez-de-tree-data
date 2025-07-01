

# Report Baumkataster 2025

## Datasets

These are the records that I was able to identify in the new portal.

- Baumbestand https://gdi.berlin.de/geonetwork/srv/ger/catalog.search#/metadata/3368004a-d596-336a-8fdf-c4391f3313dd (Die Daten umfassen Straßenbäume und einen Teil der Bäume in Grünanlagen.)
-  Baumbestand in den Liegenschaften der Grün Berlin GmbH (Anlagenbäume) https://gdi.berlin.de/geonetwork/srv/ger/catalog.search#/metadata/558eed2a-2d05-4447-a580-e26e7dccd48a (Darstellung der Bäume in den Liegenschaften der Grün Berlin GmbH und eines Teils der Bäume im Straßenraum im direkten Umfeld dieser Liegenschaften.)

Using our old download script did fail. So I downloaded the data manually using qgis.

1. Go to Layer > Add Layer > Add WFS Layer
2. Click "New" to create a new connection
3. Enter the following details:
   - Name: Berlin Tree Inventory
   - URL: https://gdi.berlin.de/services/wfs/baumbestand
4. Click "OK"
5. Select your new connection and click "Connect"
6. Choose the layer(s) you want to add
7. Click "Add" and then "Close"
8. Select layer in layer panel and click Export > Save Features as… and save it as a geojson file. CRS: EPSG:4326 - WGS 84


## Trees

The overall number of trees in the data for 2025 is higher than in 2024.

```sql
SELECT COUNT(1) AS trees, 2024 AS year FROM trees
UNION ALL
SELECT COUNT(1) AS trees, 2025 AS year FROM temp_trees
ORDER BY year;
```


| trees  | year |
| ------ | ---- |
| 885825 | 2024 |
| 971924 | 2025 |

There are some new trees.


```sql
SELECT
count(1) as new_trees	
FROM
	temp_trees tt
	FULL OUTER JOIN trees t ON t.id = tt.gml_id
WHERE
	t.id IS NULL;
```

| new_trees |
| --------- |
| 102564    |


Some trees have been removed.

```sql
SELECT count(1) as deleted_trees
FROM trees t
LEFT JOIN temp_trees tt ON t.id = tt.gml_id
WHERE tt.gml_id IS NULL;
```

| deleted_trees |
| ------------- |
| 18778         |



This is  the distribution by "bezirk".

```sql
WITH trees_2024 AS (
    SELECT bezirk, COUNT(*) AS count
    FROM trees
    GROUP BY bezirk
),
trees_2025 AS (
    SELECT bezirk, COUNT(*) AS count
    FROM temp_trees
    GROUP BY bezirk
)

SELECT 
    COALESCE(t25.bezirk, t24.bezirk) AS bezirk,
    COALESCE(t25.count, 0) AS "2025_trees",
    COALESCE(t24.count, 0) AS "2024_trees",
    COALESCE(t25.count, 0) - COALESCE(t24.count, 0) AS diff
FROM trees_2025 t25
FULL OUTER JOIN trees_2024 t24 ON t25.bezirk = t24.bezirk
ORDER BY 
    CASE WHEN t25.bezirk IS NULL OR t25.bezirk = '' THEN 0 ELSE 1 END,
    bezirk;

```


| bezirk                     | 2025_trees | 2024_trees | diff  |
| -------------------------- | ---------- | ---------- | ----- |
| Steglitz-Zehlendorf        | 112606     | 101481     | 11125 |
| Pankow                     | 100404     | 98163      | 2241  |
| Marzahn-Hellersdorf        | 103499     | 94841      | 8658  |
| Reinickendorf              | 91373      | 85024      | 6349  |
| Lichtenberg                | 79004      | 76450      | 2554  |
| Spandau                    | 72131      | 69714      | 2417  |
| Charlottenburg-Wilmersdorf | 87145      | 69650      | 17495 |
| Treptow-Köpenick           | 76557      | 68232      | 8325  |
| Mitte                      | 65296      | 63097      | 2199  |
| Tempelhof-Schöneberg       | 67888      | 62083      | 5805  |
| Neukölln                   | 63358      | 56101      | 7257  |
| Friedrichshain-Kreuzberg   | 45657      | 40989      | 4668  |
|                            | 7006       | 0          | 7006  |




## Data

- Some fields have been renamed again and need new mapping to our db schema when imported from the second wfs source by gruen berlin.
- gmlid can now be found under pitid or baumid or gisid.
- Some fields changed their type.
	-	pflanzjahr from int to text.
	-	standalter from text to int.
	-	baumhoehe from text to int.







