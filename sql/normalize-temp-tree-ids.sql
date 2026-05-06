-- ABOUTME: Fills temp_trees.gml_id from pitid/gisid after GeoJSON import.
-- ABOUTME: Includes validation queries to compare imported IDs with trees.id format.

-- Replace temp_trees if you use a different temp table name.

SELECT
	COUNT(*) AS total,
	COUNT(*) FILTER (WHERE gml_id IS NULL OR gml_id = '') AS missing_gml_id,
	COUNT(*) FILTER (WHERE pitid IS NOT NULL AND pitid <> '') AS with_pitid,
	COUNT(*) FILTER (WHERE gisid IS NOT NULL AND gisid <> '') AS with_gisid
FROM temp_trees;

UPDATE temp_trees
SET gml_id = pitid
WHERE (gml_id IS NULL OR gml_id = '')
	AND pitid ~ '^[0-9]{8}:[0-9a-f]+$';

UPDATE temp_trees
SET gml_id = replace(gisid, '_', ':')
WHERE (gml_id IS NULL OR gml_id = '')
	AND gisid ~ '^[0-9]{8}_[0-9a-f]+$';

SELECT
	COUNT(*) AS total,
	COUNT(*) FILTER (WHERE gml_id ~ '^[0-9]{8}:[0-9a-f]+$') AS valid_format,
	COUNT(*) FILTER (WHERE gml_id IS NULL OR gml_id = '') AS still_missing
FROM temp_trees;

SELECT
	COUNT(*) AS matches_existing_tree_ids
FROM temp_trees t
INNER JOIN trees tr ON tr.id = t.gml_id;

SELECT
	COUNT(*) AS temp_ids_not_in_trees
FROM temp_trees t
LEFT JOIN trees tr ON tr.id = t.gml_id
WHERE t.gml_id IS NOT NULL
	AND t.gml_id <> ''
	AND tr.id IS NULL;
