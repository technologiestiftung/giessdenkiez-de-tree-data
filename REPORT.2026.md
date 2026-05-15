<!-- ABOUTME: Report for the 2026 tree data import cycle and data quality checks. -->
<!-- ABOUTME: Documents dataset stats, identifier changes, anomalies, and SQL steps for normalization. -->

# Report Baumkataster 2026

## Datasets

|          |                                                                                                                                                                                                                         |
| :------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Name     | baumbestand:strassenbaeume                                                                                                                                                                                              |
| URL      | https://gdi.berlin.de/services/wfs/baumbestand                                                                                                                                                                          |
| Source   | forceInitialGetFeature='false' pagingEnabled='default' preferCoordinatesForWfsT11='false' srsname='EPSG:3857' typename='baumbestand:strassenbaeume' url='https://gdi.berlin.de/services/wfs/baumbestand' version='auto' |
| Provider | WFS                                                                                                                                                                                                                     |
| Layer ID | baumbestand_strassenbaeume_cfbbe46a_cfde_4b1a_ae15_66121063782d                                                                                                                                                         |

Data was exported manually from QGIS (same process as in 2025) into:

- `tree_data/data_files/strasse.geo.json`
- `tree_data/data_files/anlagen.geo.json`

## Raw file statistics

| dataset | records |
| ------- | ------: |
| strasse |  434765 |
| anlagen |  527780 |
| total   |  962545 |

- New field in 2026: `strnr`

### strasse trees

- Invalid `pflanzjahr` (cannot be stored in int4): **1**
- Suspicious `pflanzjahr`: **35**
- Suspicious `standalter`: **2**

### anlagen trees

- Invalid `pflanzjahr` (cannot be stored in int4): **0**
- Suspicious `pflanzjahr`: **146**
- Suspicious `standalter`: **3**

### Notes on suspicious values

Suspicious values are a review signal, not automatic errors.

- `pflanzjahr` suspicious heuristic: `< 1800` or `> current year + 1`
- `standalter` suspicious heuristic: `< 0` or `> 500`

One known broken example in `strasse`:

- `pitid=00008100:001afb2b`
- `pflanzjahr=19853333314434713336`
- `standalter=-1.9853333314434712e+19`

## Trees count comparison

| trees  | year |
| ------ | ---- |
| 967365 | 2025 |
| 962545 | 2026 |

<details>
<summary>SQL: Trees count comparison</summary>

```sql
-- 1) Trees count: current production snapshot vs imported 2026 data.
SELECT COUNT(*) AS trees, 2025 AS year FROM trees
UNION ALL
SELECT COUNT(*) AS trees, 2026 AS year FROM temp_trees
ORDER BY year;
```

</details>

## New trees in 2026

| new_trees |
| --------- |
| 35309     |

<details>
<summary>SQL: New trees</summary>

```sql
-- 2) New trees in 2026.
SELECT COUNT(*) AS new_trees
FROM temp_trees tt
LEFT JOIN trees t ON t.id = tt.gml_id
WHERE t.id IS NULL;
```

</details>

## Deleted trees in 2026

| deleted_trees |
| ------------- |
| 40129         |

<details>
<summary>SQL: Trees removed</summary>

```sql
-- 3) Trees removed in 2026.
SELECT COUNT(*) AS deleted_trees
FROM trees t
LEFT JOIN temp_trees tt ON tt.gml_id = t.id
WHERE tt.gml_id IS NULL;
```

</details>

| status    | count  | percentage |
| --------- | ------ | ---------- |
| unchanged | 927236 | 92.48      |
| removed   | 40129  | 4.00       |
| new       | 35309  | 3.52       |

## Distribution by bezirk comparison

| bezirk                     | 2026_trees | 2025_trees | diff  |
| -------------------------- | ---------- | ---------- | ----- |
| Charlottenburg-Wilmersdorf | 88758      | 87145      | 1613  |
| Friedrichshain-Kreuzberg   | 41768      | 43301      | -1533 |
| Lichtenberg                | 81916      | 79004      | 2912  |
| Marzahn-Hellersdorf        | 96978      | 102980     | -6002 |
| Mitte                      | 67706      | 65296      | 2410  |
| Neukölln                   | 57881      | 62359      | -4478 |
| Pankow                     | 99561      | 100404     | -843  |
| Reinickendorf              | 90869      | 91373      | -504  |
| Spandau                    | 74759      | 72131      | 2628  |
| Steglitz-Zehlendorf        | 115424     | 112606     | 2818  |
| Tempelhof-Schöneberg       | 62334      | 67210      | -4876 |
| Treptow-Köpenick           | 78295      | 76550      | 1745  |
|                            | 6296       | 0          | 6296  |
|                            | 0          | 7006       | -7006 |

<details>
<summary>SQL: Distribution by bezirk</summary>

```sql
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
```

</details>

## Data anomaly summary

| invalid_pflanzjahr | suspicious_pflanzjahr | suspicious_standalter |
| ------------------ | --------------------- | --------------------- |
| 0                  | 180                   | 5                     |

<details>
<summary>SQL: Data anomaly summary</summary>

```sql
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
```

</details>

## Moved trees summary

| matched | unchanged exact | moved any | moved < 1m | moved < 5m | moved < 10m | moved < 50m | moved < 100m | moved < 500m | moved < 1000m | max_meters |
| ------- | --------------- | --------- | ---------- | ---------- | ----------- | ----------- | ------------ | ------------ | ------------- | ---------- |
| 921598  | 893381          | 28217     | 16895      | 6034       | 2513        | 220         | 100          | 58           | 100           | 21134.31   |

| metric          | value    |
| --------------- | -------- |
| matched         | 921598   |
| unchanged exact | 893381   |
| moved any       | 28217    |
| moved < 1m      | 16895    |
| moved < 5m      | 6034     |
| moved < 10m     | 2513     |
| moved < 50m     | 220      |
| moved < 100m    | 100      |
| moved < 500m    | 58       |
| moved < 1000m   | 100      |
| max_meters      | 21134.31 |

<details>
<summary>SQL: Moved trees summary</summary>

```sql
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
```

</details>

## Top 100 moved trees

| id                | meters   | old_bezirk                 | new_bezirk                 | old_geom                                     | new_geom                                     |
| ----------------- | -------- | -------------------------- | -------------------------- | -------------------------------------------- | -------------------------------------------- |
| 00008100:00231082 | 21134.31 | Neukölln                   |                            | POINT(13.408385257193798 52.432199524899225) | POINT(13.137782046673989 52.526870962353236) |
| 00008100:00232dd6 | 17996.57 | Marzahn-Hellersdorf        | Reinickendorf              | POINT(13.580496807940376 52.53865773070235)  | POINT(13.329435930374823 52.59255799971093)  |
| 00008100:00242dce | 16104.57 | Marzahn-Hellersdorf        | Reinickendorf              | POINT(13.571345712236555 52.53942623981718)  | POINT(13.33880339064911 52.57083416781171)   |
| 00008100:002368c9 | 13764.00 | Friedrichshain-Kreuzberg   | Steglitz-Zehlendorf        | POINT(13.378642018083598 52.494335319466984) | POINT(13.211533310494413 52.42395059002176)  |
| 00008100:00236ac1 | 13757.49 | Friedrichshain-Kreuzberg   | Steglitz-Zehlendorf        | POINT(13.37320956221059 52.50111416370499)   | POINT(13.211808296774729 52.42603024544722)  |
| 00008100:002368f5 | 13645.07 | Friedrichshain-Kreuzberg   | Steglitz-Zehlendorf        | POINT(13.37369295917474 52.49574836605059)   | POINT(13.210883170106829 52.42351842666615)  |
| 00008100:00236b15 | 13535.19 | Friedrichshain-Kreuzberg   | Steglitz-Zehlendorf        | POINT(13.372164706818234 52.500123068446825) | POINT(13.213102596323292 52.42646819352945)  |
| 00008100:00236e17 | 13414.32 | Friedrichshain-Kreuzberg   | Steglitz-Zehlendorf        | POINT(13.375255334365377 52.493567901772025) | POINT(13.212438098186777 52.424930432572474) |
| 00008100:00236e35 | 13407.58 | Friedrichshain-Kreuzberg   | Steglitz-Zehlendorf        | POINT(13.375333666000548 52.4937179453805)   | POINT(13.212825687911744 52.42491487335347)  |
| 00008100:00236e46 | 13393.87 | Friedrichshain-Kreuzberg   | Steglitz-Zehlendorf        | POINT(13.375211161207426 52.493864916919314) | POINT(13.212861784830991 52.425138145650216) |
| 00008100:00236e48 | 13392.18 | Friedrichshain-Kreuzberg   | Steglitz-Zehlendorf        | POINT(13.37506083615284 52.49381041588517)   | POINT(13.212759591704623 52.42506837376605)  |
| 00008100:00236e41 | 13389.61 | Friedrichshain-Kreuzberg   | Steglitz-Zehlendorf        | POINT(13.375412810611945 52.49383707688757)  | POINT(13.213033209310606 52.425204062742)    |
| 00008100:00236e40 | 13385.61 | Friedrichshain-Kreuzberg   | Steglitz-Zehlendorf        | POINT(13.375251199127542 52.49384262303913)  | POINT(13.212970936123577 52.425185459545496) |
| 00008100:00236e42 | 13384.44 | Friedrichshain-Kreuzberg   | Steglitz-Zehlendorf        | POINT(13.375388346581339 52.493837417957415) | POINT(13.213090081190767 52.4252144973743)   |
| 00008100:00236e23 | 13380.81 | Friedrichshain-Kreuzberg   | Steglitz-Zehlendorf        | POINT(13.375164692813408 52.49365879620014)  | POINT(13.21310301922192 52.4248864681659)    |
| 00008100:00236e27 | 13363.86 | Friedrichshain-Kreuzberg   | Steglitz-Zehlendorf        | POINT(13.375030136460579 52.4936612592497)   | POINT(13.213216897785053 52.42493827977144)  |
| 00008100:00236c7c | 13361.96 | Friedrichshain-Kreuzberg   | Steglitz-Zehlendorf        | POINT(13.374359147916005 52.49412970274943)  | POINT(13.212604563433592 52.42538388216725)  |
| 00008100:00236c7d | 13349.14 | Friedrichshain-Kreuzberg   | Steglitz-Zehlendorf        | POINT(13.374164191911039 52.49403706276056)  | POINT(13.212566249031687 52.42535609930405)  |
| 00008100:00236c84 | 13346.29 | Friedrichshain-Kreuzberg   | Steglitz-Zehlendorf        | POINT(13.37405818367478 52.49411244404751)   | POINT(13.212547212220029 52.425400160771815) |
| 00008100:00236c76 | 13333.47 | Friedrichshain-Kreuzberg   | Steglitz-Zehlendorf        | POINT(13.374362079102248 52.494093567197375) | POINT(13.212937737115897 52.42550689025244)  |
| 00008100:00236bbe | 13331.00 | Friedrichshain-Kreuzberg   | Steglitz-Zehlendorf        | POINT(13.370904985306206 52.49883928012829)  | POINT(13.215999879968965 52.42491181289404)  |
| 00008100:00236c77 | 13330.72 | Friedrichshain-Kreuzberg   | Steglitz-Zehlendorf        | POINT(13.374302757849762 52.494104241780995) | POINT(13.21292678209561 52.4255185708488)    |
| 00008100:00236bc6 | 13280.45 | Friedrichshain-Kreuzberg   | Steglitz-Zehlendorf        | POINT(13.371538900740395 52.4974171246286)   | POINT(13.21594215742187 52.424777984739556)  |
| 00008100:00236ba2 | 13255.03 | Friedrichshain-Kreuzberg   | Steglitz-Zehlendorf        | POINT(13.37068447454825 52.49827433268299)   | POINT(13.215725359291659 52.42550263304502)  |
| 00008100:00236e6f | 13233.02 | Friedrichshain-Kreuzberg   | Steglitz-Zehlendorf        | POINT(13.37416319478314 52.49310382309345)   | POINT(13.213659869435915 52.425294467306315) |
| 00008100:00236f1b | 13215.03 | Friedrichshain-Kreuzberg   | Steglitz-Zehlendorf        | POINT(13.374824325848557 52.49356571095973)  | POINT(13.21476134142457 52.42565245476767)   |
| 00008100:00236e60 | 13214.93 | Friedrichshain-Kreuzberg   | Steglitz-Zehlendorf        | POINT(13.373894014509977 52.49294334216)     | POINT(13.21361212905737 52.425225227657585)  |
| 00008100:00236e87 | 13200.93 | Friedrichshain-Kreuzberg   | Steglitz-Zehlendorf        | POINT(13.374040427148897 52.49322084665154)  | POINT(13.214365506594245 52.425191479897585) |
| 00008100:00236dc2 | 13173.39 | Friedrichshain-Kreuzberg   | Steglitz-Zehlendorf        | POINT(13.375206280506426 52.49312524362855)  | POINT(13.214560177957235 52.42638703703063)  |
| 00008100:00236d9a | 13076.50 | Friedrichshain-Kreuzberg   | Steglitz-Zehlendorf        | POINT(13.373840342175802 52.49288698880143)  | POINT(13.214999304805207 52.42608670121631)  |
| 00008100:002324ce | 11812.03 | Neukölln                   | Charlottenburg-Wilmersdorf | POINT(13.416043928549142 52.43145626220832)  | POINT(13.327717396020354 52.52305431829657)  |
| 00008100:0023140c | 11811.94 | Neukölln                   | Lichtenberg                | POINT(13.432501897171026 52.42884303992975)  | POINT(13.507239094267986 52.52482241092752)  |
| 00008100:002313f5 | 11718.42 | Neukölln                   | Lichtenberg                | POINT(13.432727912720603 52.42876906741237)  | POINT(13.50645963288129 52.52410745211075)   |
| 00008100:002324c9 | 11064.69 | Neukölln                   | Charlottenburg-Wilmersdorf | POINT(13.415931589395315 52.431529495395516) | POINT(13.316190217037539 52.51033313323283)  |
| 00008100:0024cc31 | 10808.74 | Neukölln                   | Charlottenburg-Wilmersdorf | POINT(13.413740873388424 52.47845798892403)  | POINT(13.297744937649647 52.54528038712607)  |
| 00008100:0024cc2c | 10789.38 | Tempelhof-Schöneberg       | Charlottenburg-Wilmersdorf | POINT(13.41328207066128 52.478415870760244)  | POINT(13.297815966756351 52.545325030176286) |
| 00008100:00244c2f | 9087.27  | Tempelhof-Schöneberg       | Reinickendorf              | POINT(13.37316982378268 52.48945274768568)   | POINT(13.34131533492605 52.568845586262384)  |
| 00008100:00244c30 | 9082.38  | Tempelhof-Schöneberg       | Reinickendorf              | POINT(13.373129544450032 52.489459234707134) | POINT(13.341305938907864 52.56881135958093)  |
| 00008100:00244d3b | 8865.53  | Tempelhof-Schöneberg       | Reinickendorf              | POINT(13.373120358945654 52.49036052074544)  | POINT(13.340164571689828 52.567528077785994) |
| 00008100:002912b4 | 3662.02  | Spandau                    | Spandau                    | POINT(13.246550091115596 52.54720424836407)  | POINT(13.265488232410414 52.51635165531631)  |
| 00008100:003249c8 | 2495.51  | Neukölln                   | Neukölln                   | POINT(13.439915362939953 52.458736539491184) | POINT(13.428661029323418 52.48010629498201)  |
| 00008100:003249c9 | 2488.24  | Neukölln                   | Neukölln                   | POINT(13.440044656056525 52.45874478694377)  | POINT(13.428811768455176 52.480050062921954) |
| 00008100:003249ca | 2483.58  | Neukölln                   | Neukölln                   | POINT(13.440171554377018 52.45876019915373)  | POINT(13.428863870028753 52.48000671929436)  |
| 00008100:00123542 | 1538.73  | Spandau                    | Spandau                    | POINT(13.129562019442915 52.53623815570229)  | POINT(13.151670485392966 52.53297622700614)  |
| 00008100:002ccb84 | 1374.18  | Tempelhof-Schöneberg       | Tempelhof-Schöneberg       | POINT(13.372385868729811 52.469622646103254) | POINT(13.365716403270536 52.457951555441866) |
| 00008100:002ccb83 | 1282.09  | Tempelhof-Schöneberg       | Tempelhof-Schöneberg       | POINT(13.37244860383685 52.46958863176593)   | POINT(13.369049542543866 52.45824605313183)  |
| 00008100:001b17aa | 1130.91  | Marzahn-Hellersdorf        | Marzahn-Hellersdorf        | POINT(13.564522359158966 52.52149236263363)  | POINT(13.56198484692542 52.51143974015244)   |
| 00008100:001b0b17 | 1118.43  | Marzahn-Hellersdorf        | Marzahn-Hellersdorf        | POINT(13.564508503042674 52.52144934936588)  | POINT(13.561972445960592 52.51151021211807)  |
| 00008100:00314ae4 | 831.65   | Pankow                     | Pankow                     | POINT(13.385760014012014 52.57446095857465)  | POINT(13.376621208337191 52.57947053934472)  |
| 00008100:00314ae5 | 792.41   | Pankow                     | Pankow                     | POINT(13.386307149760714 52.57455405767072)  | POINT(13.376959796085494 52.57885732350425)  |
| 00008100:00314ae6 | 734.68   | Pankow                     | Pankow                     | POINT(13.38630852063673 52.574623063461225)  | POINT(13.377814451708531 52.57874733874041)  |
| 00008100:00314aed | 663.29   | Pankow                     | Pankow                     | POINT(13.386198670693265 52.5749418716887)   | POINT(13.378436695122298 52.57859334390482)  |
| 00008100:0034bc75 | 635.87   | Friedrichshain-Kreuzberg   | Friedrichshain-Kreuzberg   | POINT(13.406705233116005 52.49653420753534)  | POINT(13.397548350295702 52.49780849176291)  |
| 00008100:0034bc74 | 635.28   | Friedrichshain-Kreuzberg   | Friedrichshain-Kreuzberg   | POINT(13.40659715563798 52.49654662427869)   | POINT(13.397449942845201 52.497822814992105) |
| 00008100:00314aea | 634.37   | Pankow                     | Pankow                     | POINT(13.38756824967457 52.5747662450411)    | POINT(13.380116661772497 52.578236276754446) |
| 00008100:00123547 | 605.43   | Spandau                    | Spandau                    | POINT(13.138241176787375 52.53464639080604)  | POINT(13.129691062812928 52.536257843577374) |
| 00008100:00123548 | 601.21   | Spandau                    | Spandau                    | POINT(13.138254784458406 52.53456885651071)  | POINT(13.129819954979409 52.5362747775591)   |
| 00008100:000d7a72 | 503.19   | Charlottenburg-Wilmersdorf | Charlottenburg-Wilmersdorf | POINT(13.282926800639718 52.54071772323572)  | POINT(13.275615117800802 52.541556434388404) |
| 00008100:00314ae7 | 417.79   | Pankow                     | Pankow                     | POINT(13.38690223026933 52.57472393074922)   | POINT(13.381907064249726 52.576938012237164) |
| 00008100:00314ae8 | 400.90   | Pankow                     | Pankow                     | POINT(13.387498387157372 52.574758219402575) | POINT(13.382650155343123 52.57683610095442)  |
| 00008100:001fd4b5 | 336.63   | Lichtenberg                | Lichtenberg                | POINT(13.518322511364468 52.48674742102572)  | POINT(13.521998223662864 52.48878590919878)  |
| 00008100:00314ae9 | 301.64   | Pankow                     | Pankow                     | POINT(13.38755864890895 52.57481851206918)   | POINT(13.383629428744063 52.57610577342133)  |
| 00008100:00129c1e | 255.44   | Spandau                    | Spandau                    | POINT(13.186501929476469 52.55917466932518)  | POINT(13.182741499496895 52.55940005507347)  |
| 00008100:00129ac6 | 243.30   | Spandau                    | Spandau                    | POINT(13.182847583873816 52.55937147034238)  | POINT(13.186421046303577 52.55911036797167)  |
| 00008100:001f904e | 226.53   | Lichtenberg                | Lichtenberg                | POINT(13.49783175809561 52.486503081827635)  | POINT(13.496033979632612 52.48822121799793)  |
| 00008100:002e25be | 225.41   | Treptow-Köpenick           | Treptow-Köpenick           | POINT(13.484085595090052 52.467603380588365) | POINT(13.482087745518651 52.469224457774104) |
| 00008100:001f904d | 222.54   | Lichtenberg                | Lichtenberg                | POINT(13.497732734173642 52.486583088681506) | POINT(13.49597100299914 52.48827263711442)   |
| 00008100:00156a07 | 196.49   | Mitte                      | Mitte                      | POINT(13.374376389973225 52.55219437582165)  | POINT(13.37449024149033 52.55042862718145)   |
| 00008100:0015cce2 | 166.97   | Mitte                      | Mitte                      | POINT(13.3988731487786 52.51307792750811)    | POINT(13.39802412366084 52.514487779638095)  |
| 00008100:002c9588 | 164.85   | Marzahn-Hellersdorf        | Marzahn-Hellersdorf        | POINT(13.536363057631155 52.52983583285802)  | POINT(13.536724933981407 52.528369760323116) |
| 00008100:0028ff2f | 163.36   | Charlottenburg-Wilmersdorf | Charlottenburg-Wilmersdorf | POINT(13.302443572315171 52.52855010460466)  | POINT(13.302574127600293 52.52708312823193)  |
| 00008100:00129ace | 160.79   | Spandau                    | Spandau                    | POINT(13.19201827244906 52.55901167194038)   | POINT(13.189639933181397 52.55903266978831)  |
| 00008100:00129ac5 | 159.09   | Spandau                    | Spandau                    | POINT(13.18420170660242 52.559220254341035)  | POINT(13.186547107843476 52.55910212398128)  |
| 00008100:002da1ec | 157.34   | Tempelhof-Schöneberg       | Tempelhof-Schöneberg       | POINT(13.374115877957554 52.40980074247102)  | POINT(13.37216465529949 52.41056588990766)   |
| 00008100:002c956e | 156.51   | Marzahn-Hellersdorf        | Marzahn-Hellersdorf        | POINT(13.53633584306398 52.52976618268049)   | POINT(13.53673542761843 52.52837981783314)   |
| 00008100:000f88a8 | 155.65   | Steglitz-Zehlendorf        | Steglitz-Zehlendorf        | POINT(13.299262327376693 52.43932559223247)  | POINT(13.301209774579561 52.440067335934536) |
| 00008100:0015fb37 | 155.42   | Friedrichshain-Kreuzberg   | Friedrichshain-Kreuzberg   | POINT(13.443685125461496 52.50159701277484)  | POINT(13.442066917164402 52.502588656367024) |
| 00008100:000e063a | 155.34   | Charlottenburg-Wilmersdorf | Charlottenburg-Wilmersdorf | POINT(13.28432026101458 52.542514635167414)  | POINT(13.286233122711145 52.5432880629919)   |
| 00008100:0016b0b0 | 155.13   | Friedrichshain-Kreuzberg   | Friedrichshain-Kreuzberg   | POINT(13.442065859217683 52.50258828369326)  | POINT(13.443684097893646 52.501600326844034) |
| 00008100:00211875 | 145.26   | Spandau                    | Spandau                    | POINT(13.148724360728066 52.55782802937371)  | POINT(13.148314397278945 52.55911041232515)  |
| 00008100:002ca86a | 140.57   | Spandau                    | Spandau                    | POINT(13.216929538003534 52.54028484187288)  | POINT(13.21566935465253 52.539279567944405)  |
| 00008100:00129ad1 | 137.93   | Spandau                    | Spandau                    | POINT(13.191370827548294 52.55903218198858)  | POINT(13.189330514891621 52.559037109820196) |
| 00008100:00129c1a | 137.33   | Spandau                    | Spandau                    | POINT(13.186341054094877 52.55919431215653)  | POINT(13.184310086076438 52.55922436882291)  |
| 00008100:0034bc73 | 136.92   | Friedrichshain-Kreuzberg   | Friedrichshain-Kreuzberg   | POINT(13.440049095436425 52.491348989566085) | POINT(13.441377020051393 52.49227765064378)  |
| 00008100:002e2dce | 136.80   | Mitte                      | Mitte                      | POINT(13.311732254028335 52.54892943952478)  | POINT(13.312017015916249 52.55014746458341)  |
| 00008100:00123983 | 134.33   | Spandau                    | Spandau                    | POINT(13.18006367682491 52.53383585973913)   | POINT(13.18202864811611 52.53401104831875)   |
| 00008100:0029e818 | 134.24   | Spandau                    | Spandau                    | POINT(13.182024908018155 52.53400999911871)  | POINT(13.180061380503142 52.53383430578976)  |
| 00008100:002ab9be | 132.78   | Marzahn-Hellersdorf        | Marzahn-Hellersdorf        | POINT(13.615815009772177 52.52373974715807)  | POINT(13.613892888672671 52.52398111795147)  |
| 00008100:001c2f6c | 127.78   | Marzahn-Hellersdorf        | Marzahn-Hellersdorf        | POINT(13.571180468758715 52.48276910131595)  | POINT(13.5692949591737 52.48272450822742)    |
| 00008100:001e3dec | 123.18   | Treptow-Köpenick           | Treptow-Köpenick           | POINT(13.569499148238956 52.417526827662705) | POINT(13.568885541955696 52.416484160947995) |
| 00008100:002ca859 | 120.25   | Spandau                    | Spandau                    | POINT(13.216866041626757 52.540128696009624) | POINT(13.215777081149968 52.53927383458815)  |
| 00008100:0021a649 | 113.31   | Reinickendorf              | Reinickendorf              | POINT(13.223649996008588 52.5898545852762)   | POINT(13.22332891790793 52.58885438066569)   |
| 00008100:001f9342 | 112.75   | Lichtenberg                | Lichtenberg                | POINT(13.49245788630634 52.49166679742977)   | POINT(13.491551560577475 52.49251745785267)  |
| 00008100:001fbdac | 110.70   | Lichtenberg                | Lichtenberg                | POINT(13.511663976814878 52.51304626428578)  | POINT(13.511690060947668 52.51205084293234)  |
| 00008100:002ca865 | 109.89   | Spandau                    | Spandau                    | POINT(13.216864394127576 52.5400081613112)   | POINT(13.215719449221329 52.53930690680416)  |
| 00008100:002ca832 | 109.37   | Spandau                    | Spandau                    | POINT(13.217128631744549 52.539773072812004) | POINT(13.21573578172507 52.53927328205916)   |
| 00008100:000e063c | 106.78   | Charlottenburg-Wilmersdorf | Charlottenburg-Wilmersdorf | POINT(13.284883067143886 52.542689129295745) | POINT(13.286103963664535 52.54329804931601)  |
| 00008100:00129ad3 | 100.92   | Spandau                    | Spandau                    | POINT(13.18798040171603 52.55907949671697)   | POINT(13.186496810735033 52.559180450513)    |
| 00008100:001ff2d9 | 100.62   | Lichtenberg                | Lichtenberg                | POINT(13.519848898158543 52.50616443329922)  | POINT(13.520175376251652 52.505281631828616) |
| 00008100:002e25a0 | 100.30   | Treptow-Köpenick           | Treptow-Köpenick           | POINT(13.481605381735207 52.46909902339625)  | POINT(13.48289585658338 52.46865672845245)   |

<details>
<summary>SQL: Top moved trees</summary>

```sql
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
```

</details>

## Dsitribution of planting years (pflanzjahr)

| check_type              | range                    | count  |
| ----------------------- | ------------------------ | ------ |
| pflanzjahr distribution | 1800-1900 (old)          | 10128  |
| pflanzjahr distribution | 1900-2000                | 605288 |
| pflanzjahr distribution | 2000-2024                | 149268 |
| pflanzjahr distribution | 2025+ (future?)          | 3654   |
| pflanzjahr distribution | before 1800 (suspicious) | 174    |
| pflanzjahr distribution | null/invalid             | 194033 |

<details>
<summary>SQL: Planting year distribution</summary>

```sql
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
```

</details>
