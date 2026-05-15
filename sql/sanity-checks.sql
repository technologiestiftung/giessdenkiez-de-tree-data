-- ABOUTME: Comprehensive sanity checks comparing temp_trees with trees table.
-- ABOUTME: Reports unchanged, new, and removed trees plus data quality metrics.

-- =====================================================
-- 1. BASIC COUNTS COMPARISON
-- =====================================================

-- Total counts
SELECT
	'temp_trees total' as metric,
	COUNT(*)::text as value
FROM temp_trees
UNION ALL
SELECT
	'trees total (existing database)' as metric,
	COUNT(*)::text
FROM trees
UNION ALL
SELECT
	'temp_trees with valid gml_id' as metric,
	COUNT(*)::text
FROM temp_trees
WHERE gml_id IS NOT NULL AND gml_id <> '';

-- =====================================================
-- 2. TREE STATUS ANALYSIS
-- =====================================================

-- Trees that stayed the same (exist in both tables)
SELECT
	'trees unchanged (exist in both)' as metric,
	COUNT(*)::text as count
FROM temp_trees t
INNER JOIN trees tr ON tr.id = t.gml_id
WHERE t.gml_id IS NOT NULL AND t.gml_id <> '';

-- Trees that are new (in temp_trees but NOT in trees)
SELECT
	'trees new (in temp only)' as metric,
	COUNT(*)::text as count
FROM temp_trees t
LEFT JOIN trees tr ON tr.id = t.gml_id
WHERE t.gml_id IS NOT NULL
	AND t.gml_id <> ''
	AND tr.id IS NULL;

-- Trees that will be removed (in trees but NOT in temp_trees)
SELECT
	'trees to be removed (in trees only)' as metric,
	COUNT(*)::text as count
FROM trees tr
LEFT JOIN temp_trees t ON t.gml_id = tr.id
WHERE t.gml_id IS NULL OR t.gml_id = '';

-- =====================================================
-- 3. SUMMARY BREAKDOWN
-- =====================================================

WITH tree_comparison AS (
	SELECT
		tr.id as existing_id,
		t.gml_id as new_id
	FROM trees tr
	FULL OUTER JOIN temp_trees t ON tr.id = t.gml_id
		AND t.gml_id IS NOT NULL
		AND t.gml_id <> ''
)
SELECT
	CASE
		WHEN existing_id IS NOT NULL AND new_id IS NOT NULL THEN 'unchanged'
		WHEN existing_id IS NULL AND new_id IS NOT NULL THEN 'new'
		WHEN existing_id IS NOT NULL AND new_id IS NULL THEN 'removed'
		ELSE 'other'
	END as status,
	COUNT(*) as count,
	ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM tree_comparison
GROUP BY 1
ORDER BY 2 DESC;

-- =====================================================
-- 4. DATA QUALITY CHECKS
-- =====================================================

-- Temp trees with missing/invalid gml_id
SELECT
	'temp_trees missing gml_id' as metric,
	COUNT(*)::text as count
FROM temp_trees
WHERE gml_id IS NULL OR gml_id = '';

-- Check gml_id format validity
SELECT
	'temp_trees with valid gml_id format' as metric,
	COUNT(*)::text as count
FROM temp_trees
WHERE gml_id ~ '^[0-9]{8}:[0-9a-f]+$';

-- Duplicate gml_ids in temp_trees
SELECT
	'temp_trees duplicate gml_ids' as metric,
	COUNT(*)::text as count
FROM (
	SELECT gml_id, COUNT(*) as cnt
	FROM temp_trees
	WHERE gml_id IS NOT NULL AND gml_id <> ''
	GROUP BY gml_id
	HAVING COUNT(*) > 1
) dups;

-- =====================================================
-- 5. FIELD-LEVEL COMPARISON (for unchanged trees)
-- =====================================================

-- Compare key fields between tables for trees that exist in both
SELECT
	'art_dtsch changes' as field,
	COUNT(*) as count
FROM temp_trees t
INNER JOIN trees tr ON tr.id = t.gml_id
WHERE t.art_dtsch IS DISTINCT FROM tr.art_dtsch

UNION ALL

SELECT
	'art_bot changes' as field,
	COUNT(*)
FROM temp_trees t
INNER JOIN trees tr ON tr.id = t.gml_id
WHERE t.art_bot IS DISTINCT FROM tr.art_bot

UNION ALL

SELECT
	'pflanzjahr changes' as field,
	COUNT(*)
FROM temp_trees t
INNER JOIN trees tr ON tr.id = t.gml_id
WHERE t.pflanzjahr IS DISTINCT FROM tr.pflanzjahr

UNION ALL

SELECT
	'baumhoehe changes' as field,
	COUNT(*)
FROM temp_trees t
INNER JOIN trees tr ON tr.id = t.gml_id
WHERE t.baumhoehe::text IS DISTINCT FROM tr.baumhoehe

UNION ALL

SELECT
	'strname changes' as field,
	COUNT(*)
FROM temp_trees t
INNER JOIN trees tr ON tr.id = t.gml_id
WHERE t.strname IS DISTINCT FROM tr.strname

ORDER BY 2 DESC;

-- =====================================================
-- 6. SPATIAL/GEOMETRY CHECKS
-- =====================================================

-- Trees with geometry in temp_trees
SELECT
	'temp_trees with geometry' as metric,
	COUNT(*)::text as count
FROM temp_trees
WHERE geom IS NOT NULL;

-- Trees with null geometry (should be 0)
SELECT
	'temp_trees missing geometry' as metric,
	COUNT(*)::text as count
FROM temp_trees
WHERE geom IS NULL;

-- Check for trees with suspicious location changes (> 100m move)
SELECT
	'trees with major location change (>100m)' as metric,
	COUNT(*)::text as count
FROM temp_trees t
INNER JOIN trees tr ON tr.id = t.gml_id
WHERE t.geom IS NOT NULL
	AND tr.geom IS NOT NULL
	AND ST_Distance(
		ST_Transform(t.geom, 3857),
		ST_Transform(tr.geom, 3857)
	) > 100;

-- =====================================================
-- 7. TREE TYPE BREAKDOWN
-- =====================================================

SELECT
	'type' as field,
	"type" as value,
	COUNT(*) as count
FROM temp_trees
WHERE "type" IS NOT NULL
GROUP BY "type"
ORDER BY COUNT(*) DESC;

-- =====================================================
-- 8. REFERENTIAL INTEGRITY CHECKS
-- =====================================================

-- Trees that have been watered (will lose history if removed)
SELECT
	'trees_watered entries for trees to be removed' as metric,
	COUNT(DISTINCT tw.tree_id)::text as count
FROM trees_watered tw
INNER JOIN trees tr ON tr.id = tw.tree_id
LEFT JOIN temp_trees t ON t.gml_id = tr.id
WHERE t.gml_id IS NULL OR t.gml_id = '';

-- Trees that are adopted (will lose adoption if removed)
SELECT
	'trees_adopted entries for trees to be removed' as metric,
	COUNT(DISTINCT ta.tree_id)::text as count
FROM trees_adopted ta
INNER JOIN trees tr ON tr.id = ta.tree_id
LEFT JOIN temp_trees t ON t.gml_id = tr.id
WHERE t.gml_id IS NULL OR t.gml_id = '';

-- =====================================================
-- 9. VALUE DISTRIBUTION SANITY CHECKS
-- =====================================================

-- Planting year distribution
SELECT
	'pflanzjahr distribution' as check_type,
	CASE
		WHEN pflanzjahr < 1800 THEN 'before 1800 (suspicious)'
		WHEN pflanzjahr BETWEEN 1800 AND 1900 THEN '1800-1900 (old)'
		WHEN pflanzjahr BETWEEN 1900 AND 2000 THEN '1900-2000'
		WHEN pflanzjahr BETWEEN 2000 AND 2024 THEN '2000-2024'
		WHEN pflanzjahr >= 2025 THEN '2025+ (future?)'
		ELSE 'null/invalid'
	END as range,
	COUNT(*) as count
FROM temp_trees
GROUP BY 2
ORDER BY 2;

-- Height distribution
SELECT
	'baumhoehe distribution' as check_type,
	CASE
		WHEN baumhoehe < 0 THEN 'negative (invalid)'
		WHEN baumhoehe BETWEEN 0 AND 5 THEN '0-5m (small)'
		WHEN baumhoehe BETWEEN 5 AND 15 THEN '5-15m (medium)'
		WHEN baumhoehe BETWEEN 15 AND 30 THEN '15-30m (large)'
		WHEN baumhoehe > 30 THEN '30m+ (very large)'
		ELSE 'null'
	END as range,
	COUNT(*) as count
FROM temp_trees
GROUP BY 2
ORDER BY 2;

-- =====================================================
-- 10. SAMPLE ISSUES FOR INVESTIGATION
-- =====================================================

-- Sample of trees with missing gml_id
SELECT
	' SAMPLE: temp_trees with null gml_id' as info,
	baumid,
	pitid,
	gisid,
	strname,
	art_dtsch
FROM temp_trees
WHERE gml_id IS NULL OR gml_id = ''
LIMIT 5;

-- Sample of trees that will be removed but have watering history
SELECT
	' SAMPLE: trees to remove with watering history' as info,
	tr.id,
	tr.art_dtsch,
	tr.strname,
	COUNT(tw.id) as waterings
FROM trees tr
LEFT JOIN temp_trees t ON t.gml_id = tr.id
INNER JOIN trees_watered tw ON tw.tree_id = tr.id
WHERE t.gml_id IS NULL OR t.gml_id = ''
GROUP BY tr.id, tr.art_dtsch, tr.strname
ORDER BY COUNT(tw.id) DESC
LIMIT 5;
