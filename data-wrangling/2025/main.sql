-- steps to take for dataprep in 2025
-- 1. move all ids from pitid to gml_id
UPDATE temp_trees
SET gml_id = pitid
WHERE gml_id IS NULL
	AND pitid IS NOT NULL;
-- 2. move all ids from baumid to gmlid
UPDATE temp_trees
SET gml_id = baumid
WHERE gml_id IS NULL
	AND baumid IS NOT NULL;
-- 3. we still have some trees that don't have a pitid nor an baum id but a gisid and the gisid has a different style. To keep it as consistent as possible we do a replace.
UPDATE temp_trees
SET gml_id = REPLACE(gisid, '_', ':')
WHERE gml_id IS NULL
	AND gisid IS NOT NULL;
-- 4. We need to mangle some fields to match the final trees table
-- baumhoehe from float8 to text
ALTER TABLE temp_trees
ALTER COLUMN baumhoehe TYPE text USING baumhoehe::text;
-- kronendurchmesser
-- first copy all values from temp_trees.kronendurc to temp_trees.kronendurch
SELECT count(1)
from temp_trees
WHERE kronendurc is not null;
UPDATE temp_trees
SET kronendurch = kronendurc
WHERE kronendurch IS NULL
	AND kronendurc IS NOT NULL;
-- now we copy all the values to the text row
SELECT count(1)
from temp_trees
where kronedurch is not null;
UPDATE temp_trees
SET kronedurch = kronendurch::text
WHERE kronedurch IS NULL
	AND kronendurch IS NOT NULL;
-- baumart_de to art_dtsch
UPDATE temp_trees
SET art_dtsch = baumart_de
WHERE art_dtsch IS NULL
	AND baumart_de IS NOT NULL;
-- gattung bo to gattung
UPDATE temp_trees
SET gattung = gattung_bo
WHERE gattung IS NULL
	AND gattung_bo IS NOT NULL;
-- stammumfang
SELECT count(1)
from temp_trees
where stammumfg is not null;
UPDATE temp_trees
SET stammumfg = stammumfan::text
WHERE stammumfg IS NULL
	AND stammumfan IS NOT NULL;