-- ABOUTME: Produces DB-verified statistics for REPORT.2026.md.
-- ABOUTME: Compares public.trees with imported public.temp_trees after ID normalization.


-- 1) Trees count: current production snapshot vs imported 2026 data.
SELECT COUNT(*) AS trees, 2025 AS year FROM trees
UNION ALL
SELECT COUNT(*) AS trees, 2026 AS year FROM temp_trees
ORDER BY year;

-- 2) New trees in 2026.
SELECT COUNT(*) AS new_trees
FROM temp_trees tt
LEFT JOIN trees t ON t.id = tt.gml_id
WHERE t.id IS NULL;

-- 3) Trees removed in 2026.
SELECT COUNT(*) AS deleted_trees
FROM trees t
LEFT JOIN temp_trees tt ON tt.gml_id = t.id
WHERE tt.gml_id IS NULL;

-- 4) Distribution by bezirk.
WITH trees_2025 AS (
	SELECT bezirk, COUNT(*) AS count
	FROM trees
	GROUP BY bezirk
),
trees_2026 AS (
	SELECT bezirk, COUNT(*) AS count
	FROM temp_trees
	GROUP BY bezirk
)
SELECT
	COALESCE(t26.bezirk, t25.bezirk) AS bezirk,
	COALESCE(t26.count, 0) AS "2026_trees",
	COALESCE(t25.count, 0) AS "2025_trees",
	COALESCE(t26.count, 0) - COALESCE(t25.count, 0) AS diff
FROM trees_2026 t26
FULL OUTER JOIN trees_2025 t25 ON t26.bezirk = t25.bezirk
ORDER BY
	CASE WHEN COALESCE(t26.bezirk, t25.bezirk) = '' THEN 0 ELSE 1 END,
	bezirk;

-- 5) ID availability after normalization.
SELECT
	type,
	COUNT(*) AS total,
	COUNT(*) FILTER (WHERE gml_id IS NULL OR gml_id = '') AS missing_gml_id,
	COUNT(*) FILTER (WHERE pitid IS NULL OR pitid = '') AS missing_pitid,
	COUNT(*) FILTER (WHERE gisid IS NULL OR gisid = '') AS missing_gisid
FROM temp_trees
GROUP BY type
ORDER BY type;

-- 6) Data anomaly summary.
WITH base AS (
	SELECT
		pflanzjahr,
		standalter,
		CASE
			WHEN pflanzjahr IS NULL OR trim(pflanzjahr::text) = '' THEN NULL
			WHEN trim(pflanzjahr::text) ~ '^-?\d+(\.\d+)?([eE][-+]?\d+)?$' THEN (trim(pflanzjahr::text))::numeric
			ELSE NULL
		END AS pflanzjahr_num,
		CASE
			WHEN standalter IS NULL OR trim(standalter::text) = '' THEN NULL
			WHEN trim(standalter::text) ~ '^-?\d+(\.\d+)?([eE][-+]?\d+)?$' THEN (trim(standalter::text))::numeric
			ELSE NULL
		END AS standalter_num
	FROM temp_trees
)
SELECT
	COUNT(*) FILTER (
		WHERE pflanzjahr IS NOT NULL
			AND trim(pflanzjahr::text) <> ''
			AND (
				pflanzjahr_num IS NULL
				OR pflanzjahr_num != trunc(pflanzjahr_num)
				OR pflanzjahr_num > 2147483647
				OR pflanzjahr_num < -2147483648
			)
	) AS invalid_pflanzjahr,
	COUNT(*) FILTER (
		WHERE pflanzjahr IS NOT NULL
			AND trim(pflanzjahr::text) <> ''
			AND (
				pflanzjahr_num IS NULL
				OR pflanzjahr_num != trunc(pflanzjahr_num)
				OR pflanzjahr_num < 1800
				OR pflanzjahr_num > (extract(year from now()) + 1)
			)
	) AS suspicious_pflanzjahr,
	COUNT(*) FILTER (
		WHERE standalter IS NOT NULL
			AND trim(standalter::text) <> ''
			AND (
				standalter_num IS NULL
				OR standalter_num < 0
				OR standalter_num > 500
			)
	) AS suspicious_standalter
FROM base;

-- 7) Moved trees summary. Synthetic ID prefixes are excluded.
WITH matched AS (
	SELECT
		t.id,
		ST_DistanceSphere(
			ST_Transform(t.geom, 4326),
			ST_Transform(tt.geom, 4326)
		) AS meters
	FROM trees t
	JOIN temp_trees tt ON tt.gml_id = t.id
	WHERE split_part(t.id, ':', 1) NOT IN ('88888888', '99999999')
)
SELECT
	COUNT(*) AS matched,
	COUNT(*) FILTER (WHERE meters = 0) AS unchanged_exact,
	COUNT(*) FILTER (WHERE meters > 0) AS "moved any",
	COUNT(*) FILTER (WHERE meters > 1) AS "moved < 1m",
	COUNT(*) FILTER (WHERE meters > 5) AS "moved < 5m",
	COUNT(*) FILTER (WHERE meters > 10) AS "moved < 10m",
	COUNT(*) FILTER (WHERE meters > 50) AS "moved < 50m",
	COUNT(*) FILTER (WHERE meters > 100) AS "moved < 100m",
	COUNT(*) FILTER (WHERE meters > 500) AS "moved < 500m",
	COUNT(*) FILTER (WHERE meters > 100) AS "moved < 1000m",

	ROUND(MAX(meters)::numeric, 2) AS max_meters
FROM matched;

-- 8) Top moved trees for manual inspection. Synthetic ID prefixes are excluded.
SELECT
	t.id,
	ROUND(
		ST_DistanceSphere(
			ST_Transform(t.geom, 4326),
			ST_Transform(tt.geom, 4326)
		)::numeric,
		2
	) AS meters,
	t.bezirk AS old_bezirk,
	tt.bezirk AS new_bezirk,
	ST_AsText(ST_Transform(t.geom, 4326)) AS old_geom,
	ST_AsText(ST_Transform(tt.geom, 4326)) AS new_geom
FROM trees t
JOIN temp_trees tt ON tt.gml_id = t.id
WHERE split_part(t.id, ':', 1) NOT IN ('88888888', '99999999')
	AND ST_DistanceSphere(ST_Transform(t.geom, 4326), ST_Transform(tt.geom, 4326)) > 1
ORDER BY ST_DistanceSphere(ST_Transform(t.geom, 4326), ST_Transform(tt.geom, 4326)) DESC
LIMIT 100;
