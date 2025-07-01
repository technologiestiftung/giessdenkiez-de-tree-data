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
-- copy all values from temp_trees.kronendurc to temp_trees.kronendurch
UPDATE temp_trees
SET kronendurch = kronendurc
WHERE kronendurch IS NULL
	AND kronendurc IS NOT NULL;
-- now we copy all the values to the text row
UPDATE temp_trees
SET kronedurch = kronendurch::text
WHERE kronedurch IS NULL
	AND kronendurch IS NOT NULL;
CREATE TABLE tree_name_mapping (
	old_name TEXT PRIMARY KEY,
	new_name TEXT NOT NULL
);
-- Insert the mappings
INSERT INTO tree_name_mapping (old_name, new_name)
VALUES ('AHORN', 'Ahorn'),
	(
		'AHORNBLÄTTRIGE PLATANE',
		'Ahornblättrige Platane'
	),
	(
		'AMBERBAUM, AMERICAN SWEETGUM',
		'Amberbaum, American Sweetgum'
	),
	('AMERIKANISCHE LINDE', 'Amerikanische Linde'),
	(
		'AMERIKANISCHE ROT-EICHE',
		'Amerikanische Rot-Eiche'
	),
	(
		'AMERIKANISCHE WEISS-EICHE',
		'Amerikanische Weiß-Eiche'
	),
	(
		'AMERIKANISCHER ZÜRGELBAUM',
		'Amerikanischer Zürgelbaum'
	),
	(
		'AMUR-AHORN - FEUER-AHORN',
		'Amur-Ahorn - Feuer-Ahorn'
	),
	('APFEL', 'Apfel'),
	(
		'APFEL ''FREIHERR VON BERLEPSCH''',
		'Apfel ''Freiherr von Berlepsch'''
	),
	('APFEL ''KLARAPFEL''', 'Apfel ''Klarapfel'''),
	(
		'APFEL ''ROTE STERNRENETTE''',
		'Apfel ''Rote Sternrenette'''
	),
	('APFEL-DORN, LANG-DORN', 'Apfel-Dorn, Lang-Dorn'),
	('BALSAM-PAPPEL', 'Balsam-Pappel'),
	(
		'BAND-WEIDE - HANF-WEIDE',
		'Band-Weide - Hanf-Weide'
	),
	(
		'BAUM-HASEL - TÜRKISCHE HASEL',
		'Baum-Hasel - Türkische Hasel'
	),
	(
		'BAUM-MAGNOLIE, KOBUSHI-MAGNOLIE',
		'Baum-Magnolie, Kobushi-Magnolie'
	),
	(
		'BAUM-WEIDE - KOPF-WEIDE - SILBER/WEISS-WEIDE',
		'Baum-Weide - Kopf-Weide - Silber/Weiß-Weide'
	),
	(
		'BERG-AHORN  -  WEISS-AHORN',
		'Berg-Ahorn - Weiß-Ahorn'
	),
	(
		'BERG-AHORN ''ATROPURPUREUM''',
		'Berg-Ahorn ''Atropurpureum'''
	),
	(
		'BERG-KIRSCHE,SCHARLACH-KIRSCHE',
		'Berg-Kirsche, Scharlach-Kirsche'
	),
	('BERG-ULME', 'Berg-Ulme'),
	('BERGKIEFER, LATSCHE', 'Bergkiefer, Latsche'),
	(
		'BERLINER LORBEER-PAPPEL',
		'Berliner Lorbeer-Pappel'
	),
	('BIRKEN-PAPPEL', 'Birken-Pappel'),
	('BIRNE', 'Birne'),
	(
		'BLAUE STECH-FICHTE ''GLAUCA''',
		'Blaue Stech-Fichte ''Glauca'''
	),
	(
		'BLAUGLOCKENBAUM,PAULOWNIE',
		'Blauglockenbaum, Paulownie'
	),
	('BLUMEN-HARTRIEGEL', 'Blumen-Hartriegel'),
	('BLUTBUCHE', 'Blutbuche'),
	('BLUTPFLAUME', 'Blutpflaume'),
	(
		'DOUGLASFICHTE, DOUGLASIE',
		'Douglasfichte, Douglasie'
	),
	(
		'DREIDORNIGER LEDERHÜLSENBAUM',
		'Dreidorniger Lederhülsenbaum'
	),
	(
		'DREILAPPIGER AHORN, BURGEN-AHORN',
		'Dreilappiger Ahorn, Burgen-Ahorn'
	),
	('DREISPITZ AHORN', 'Dreispitz Ahorn'),
	('EBERESCHE - MEHLBEERE', 'Eberesche - Mehlbeere'),
	('ECHTE MEHLBEERE', 'Echte Mehlbeere'),
	('ECHTE ORNÄS-BIRKE', 'Echte Ornäs-Birke'),
	('ECHTER FÄCHER-AHORN', 'Echter Fächer-Ahorn'),
	('EICHE', 'Eiche'),
	(
		'EICHE ''FASTIGIATA KOSTER''',
		'Eiche ''Fastigiata Koster'''
	),
	(
		'EINGRIFFLIGER WEISSDORN',
		'Eingriffliger Weißdorn'
	),
	(
		'EISENHOLZBAUM,PARROTIE',
		'Eisenholzbaum, Parrotie'
	),
	('ELSBEERE', 'Elsbeere'),
	('ERLE', 'Erle'),
	('ESCHEN-AHORN', 'Eschen-Ahorn'),
	(
		'ESSIGBAUM - HIRSCHKOLBEN-SUMACH',
		'Essigbaum - Hirschkolben-Sumach'
	),
	('ESSKASTANIE, MARONE', 'Esskastanie, Marone'),
	('EUROPÄISCHE LÄRCHE', 'Europäische Lärche'),
	(
		'FELD-AHORN - HECKEN-AHORN - MASSHOLDER',
		'Feld-Ahorn - Hecken-Ahorn - Massholder'
	),
	(
		'FELD-RÜSTER - FELD-ULME',
		'Feld-Rüster - Feld-Ulme'
	),
	(
		'FELSEN-KIRSCHE,WEICHSEL-KIRSCHE,STEINWEICHSEL',
		'Felsen-Kirsche, Weichsel-Kirsche, Steinweichsel'
	),
	('FELSENBIRNE', 'Felsenbirne'),
	('FLATTER-ULME', 'Flatter-Ulme'),
	('FLAUMEICHE', 'Flaumeiche'),
	(
		'FLIEDERBEERSTRAUCH - SCHWARZER HOLUNDER',
		'Fliederbeerstrauch - Schwarzer Holunder'
	),
	('FLÜGELNUSS', 'Flügelnuss'),
	('FORRESTS AHORN', 'Forrests Ahorn'),
	('FÄCHERBLATTBAUM', 'Fächerblattbaum'),
	('FÄCHERPALME', 'Fächerpalme'),
	(
		'GEFUELLTBLÜHENDE VOGELKIRSCHE',
		'Gefülltblühende Vogelkirsche'
	),
	(
		'GEFÜLLTBLÜHENDE ROSSKASTANIE',
		'Gefülltblühende Rosskastanie'
	),
	(
		'GEMEINE EBERESCHE - VOGELBEERBAUM',
		'Gemeine Eberesche - Vogelbeerbaum'
	),
	('GEMEINE EIBE', 'Gemeine Eibe'),
	(
		'GEMEINE HAINBUCHE - GEMEINE WEISSBUCHE',
		'Gemeine Hainbuche - Gemeine Weißbuche'
	),
	(
		'GEMEINE KIEFER  -  WALD-KIEFER',
		'Gemeine Kiefer - Wald-Kiefer'
	),
	('GEMEINE ROSSKASTANIE', 'Gemeine Rosskastanie'),
	('GEMEINER FLIEDER', 'Gemeiner Flieder'),
	('GEMEINER GOLDREGEN', 'Gemeiner Goldregen'),
	(
		'GEMEINER WEGDORN - ECHTER KREUZDORN',
		'Gemeiner Wegdorn - Echter Kreuzdorn'
	),
	(
		'GEWEIHBAUM, KENTUCKY COFFEE-TREE',
		'Geweihbaum, Kentucky Coffee-Tree'
	),
	('GEWÖHNLICHE ESCHE', 'Gewöhnliche Esche'),
	(
		'GEWÖHNLICHER JUDASBAUM',
		'Gewöhnlicher Judasbaum'
	),
	(
		'GLEDITSCHIE ''SKYLINE''',
		'Gleditschie ''Skyline'''
	),
	(
		'GOLD-BIRKE - ERMANS BIRKE',
		'Gold-Birke - Ermans Birke'
	),
	(
		'GOLD-BLASENBAUM, LAMPIONBAUM',
		'Gold-Blasenbaum, Lampionbaum'
	),
	('GRAU-ERLE,  WEISS-ERLE', 'Grau-Erle, Weiß-Erle'),
	('GRAU-PAPPEL', 'Grau-Pappel'),
	(
		'GRAU-TANNE - KOLORADO-TANNE',
		'Grau-Tanne - Kolorado-Tanne'
	),
	(
		'GROßBLÄTTRIGE LINDE - SOMMER-LINDE',
		'Großblättrige Linde - Sommer-Linde'
	),
	('GRÜN-ERLE', 'Grün-Erle'),
	(
		'GRÜNER PERÜCKENSTRAUCH',
		'Grüner Perückenstrauch'
	),
	('GURKEN-MAGNOLIE', 'Gurken-Magnolie'),
	('GÖTTERBAUM', 'Götterbaum'),
	('HAHNENSPORN-WEISSDORN', 'Hahnensporn-Weißdorn'),
	('HARTRIEGEL', 'Hartriegel'),
	(
		'HASELNUSS, GEWÖHNLICHE HASEL',
		'Haselnuss, Gewöhnliche Hasel'
	),
	('HAUSZWETSCHGE', 'Hauszwetschge'),
	(
		'HERZBLÄTTRIGE ERLE, ITALIENISCHE ERLE',
		'Herzblättrige Erle, Italienische Erle'
	),
	('HIGAN-KIRSCHE', 'Higan-Kirsche'),
	(
		'HOHER ETAGEN-HARTRIEGEL',
		'Hoher Etagen-Hartriegel'
	),
	(
		'HOLZ-APFELBAUM,APFELBAUM',
		'Holz-Apfelbaum, Apfelbaum'
	),
	('HONOKI-MAGNOLIE', 'Honoki-Magnolie'),
	('HYBRID - PAPPEL', 'Hybrid-Pappel'),
	(
		'HÄNGE-WEIDE  -  TRAUER-WEIDE',
		'Hänge-Weide - Trauer-Weide'
	),
	(
		'ITALIENISCHE PYRAMIDEN-PAPPEL',
		'Italienische Pyramiden-Pappel'
	),
	(
		'JAPANISCHE BLÜTENKIRSCHE',
		'Japanische Blütenkirsche'
	),
	(
		'JAPANISCHE ZIERKIRSCHE ''KANZAN''',
		'Japanische Zierkirsche ''Kanzan'''
	),
	(
		'JAPANISCHER SCHNURBAUM - PAGODENBAUM',
		'Japanischer Schnurbaum - Pagodenbaum'
	),
	('KANADISCHE PAPPEL', 'Kanadische Pappel'),
	(
		'KATSURABAUM, KUCHENBAUM',
		'Katsurabaum, Kuchenbaum'
	),
	(
		'KAUKASUS-FICHTE - MORGENLÄNDISCHE FICHTE - ORIENT-FICHTE',
		'Kaukasus-Fichte - Morgenländische Fichte - Orient-Fichte'
	),
	('KIEFER', 'Kiefer'),
	('KIRSCHE', 'Kirsche'),
	(
		'KIRSCHPFLAUME,MYROBALANE',
		'Kirschpflaume, Myrobalane'
	),
	(
		'KNACK-WEIDE - BRUCH-WEIDE',
		'Knack-Weide - Bruch-Weide'
	),
	('KOLCHISCHER AHORN', 'Kolchischer Ahorn'),
	('KOREA - TANNE', 'Korea-Tanne'),
	('KORKENZIEHER-WEIDE', 'Korkenzieher-Weide'),
	(
		'KORNELKIRSCHE,HERLITZE',
		'Kornelkirsche, Herlitze'
	),
	('KREUZDORN - FAULBAUM', 'Kreuzdorn - Faulbaum'),
	('KRIM-LINDE', 'Krim-Linde'),
	('KUGEL-AHORN', 'Kugel-Ahorn'),
	('KULTUR-BIRNE', 'Kultur-Birne'),
	('KULTURAPFEL', 'Kulturapfel'),
	(
		'KUPFER-BIRKE  -  CHINA-BIRKE',
		'Kupfer-Birke - China-Birke'
	),
	('KUPFER-FELSENBIRNE', 'Kupfer-Felsenbirne'),
	(
		'Koreanische Duftesche /Stinkesche',
		'Koreanische Duftesche/Stinkesche'
	),
	('LEBENSBAUM', 'Lebensbaum'),
	('LINDE', 'Linde'),
	('MAGNOLIE', 'Magnolie'),
	('MAHAGONI-KIRSCHE', 'Mahagoni-Kirsche'),
	('MAMMUTBAUM', 'Mammutbaum'),
	(
		'MANNA-ESCHE, BLUMEN-ESCHE',
		'Manna-Esche, Blumen-Esche'
	),
	('MISPEL', 'Mispel'),
	('MOOR-BIRKE', 'Moor-Birke'),
	(
		'MORGENLÄNDISCHER LEBENSBAUM',
		'Morgenländischer Lebensbaum'
	),
	('Mostgummi-Eukalyptus', 'Mostgummi-Eukalyptus'),
	('MÄHNEN-FICHTE', 'Mähnen-Fichte'),
	('NORDMANNTANNE', 'Nordmanntanne'),
	('OREGON-ESCHE', 'Oregon-Esche'),
	(
		'OXELBEERE - SCHWEDISCHE MEHLBEERE',
		'Oxelbeere - Schwedische Mehlbeere'
	),
	('PAPIER-BIRKE', 'Papier-Birke'),
	('PAPPEL', 'Pappel'),
	('PERSISCHE EICHE', 'Persische Eiche'),
	('PFAFFENHÜTCHEN', 'Pfaffenhütchen'),
	('PFIRSICH', 'Pfirsich'),
	('PFLAUME', 'Pflaume'),
	(
		'PFLAUMENBLÄTTRIGER WEISS-DORN',
		'Pflaumenblättriger Weiß-Dorn'
	),
	(
		'POMMERN-WEIDE - REIF-WEIDE',
		'Pommern-Weide - Reif-Weide'
	),
	(
		'PONTISCHE EICHE, ARMENISCHE EICHE',
		'Pontische Eiche, Armenische Eiche'
	),
	(
		'PURPUR-BIRKE  -  BLUT-BIRKE',
		'Purpur-Birke - Blut-Birke'
	),
	(
		'PURPUR-KASTANIE - ROTBLÜHENDE ROSSKASTANIE',
		'Purpur-Kastanie - Rotblühende Rosskastanie'
	),
	('PYRAMIDEN-EICHE', 'Pyramiden-Eiche'),
	('PYRAMIDEN-HAINBUCHE', 'Pyramiden-Hainbuche'),
	('QUITTE', 'Quitte'),
	('ROT-/WIEßDORN', 'Rot-/Weißdorn'),
	(
		'ROT-AHORN, SCHARLACH- AHORN, SUMPF- AHORN',
		'Rot-Ahorn, Scharlach-Ahorn, Sumpf-Ahorn'
	),
	(
		'ROT-BUCHE  - WALD-BUCHE',
		'Rot-Buche - Wald-Buche'
	),
	(
		'ROT-ERLE, SCHWARZ-ERLE',
		'Rot-Erle, Schwarz-Erle'
	),
	('ROTER HARTRIEGEL', 'Roter Hartriegel'),
	('ROTFICHTE', 'Rotfichte'),
	('SAL-WEIDE, PALM WEIDE', 'Sal-Weide, Palm-Weide'),
	(
		'SANDBIRKE, WEISS-BIRKE',
		'Sandbirke, Weiß-Birke'
	),
	('SANDDORN', 'Sanddorn'),
	('SCHARLACH-EICHE', 'Scharlach-Eiche'),
	(
		'SCHEIN-AKAZIE - SILBERREGEN',
		'Schein-Akazie - Silberregen'
	),
	(
		'SCHEINAKAZIE ''BESSONIANA''',
		'Scheinakazie ''Bessoniana'''
	),
	('SCHEINZYPRESSE', 'Scheinzypresse'),
	('SCHLEHE,SCHWARZDORN', 'Schlehe, Schwarzdorn'),
	(
		'SCHMALBLÄTTRIGE ÖLWEIDE',
		'Schmalblättrige Ölweide'
	),
	('SCHMUCK-EBERESCHE', 'Schmuck-Eberesche'),
	(
		'SCHWARZ-BIRKE  -  UFER-BIRKE',
		'Schwarz-Birke - Ufer-Birke'
	),
	('SCHWARZ-PAPPEL', 'Schwarz-Pappel'),
	(
		'SCHWARZER MAULBEERBAUM',
		'Schwarzer Maulbeerbaum'
	),
	('SCHWARZKIEFER', 'Schwarzkiefer'),
	('SCHWARZNUSS', 'Schwarznuss'),
	('SERBISCHE-FICHTE', 'Serbische Fichte'),
	('SIBIRISCHE ULME', 'Sibirische Ulme'),
	('SILBER-AHORN', 'Silber-Ahorn'),
	('SILBER-LINDE', 'Silber-Linde'),
	('SILBER-PAPPEL', 'Silber-Pappel'),
	('SILBER-WEIDE', 'Silber-Weide'),
	(
		'SILBERWEIDE ''LIEMPDE''',
		'Silberweide ''Liempde'''
	),
	(
		'SOMMER-EICHE - STIEL-EICHE',
		'Sommer-Eiche - Stiel-Eiche'
	),
	('SPEIERLING', 'Speierling'),
	('SPITZ-AHORN', 'Spitz-Ahorn'),
	(
		'SPITZ-AHORN ''DEBORAH''',
		'Spitz-Ahorn ''Deborah'''
	),
	(
		'SPÄTBLÜHENDE TRAUBEN-KIRSCHE',
		'Spätblühende Trauben-Kirsche'
	),
	('STECH-FICHTE', 'Stech-Fichte'),
	(
		'STECH-FICHTE - SITKA-FICHTE',
		'Stech-Fichte - Sitka-Fichte'
	),
	(
		'STECHPALME, GEMEINE HÜLSE',
		'Stechpalme, Gemeine Hülse'
	),
	('SUMPF-EICHE', 'Sumpf-Eiche'),
	('SUMPFZYPRESSE', 'Sumpfzypresse'),
	('Scharlach-Weißdorn', 'Scharlach-Weißdorn'),
	('SÄULEN-BIRKE', 'Säulen-Birke'),
	('SÄULEN-BUCHE', 'Säulen-Buche'),
	('SÜDLICHER ZÜRGELBAUM', 'Südlicher Zürgelbaum'),
	(
		'SÜSS-KIRSCHE,VOGEL-KIRSCHE',
		'Süß-Kirsche, Vogel-Kirsche'
	),
	(
		'SÜSSKIRSCHE ''HEDELFINGER RIESEN''',
		'Süßkirsche ''Hedelfinger Riesen'''
	),
	('TANNE', 'Tanne'),
	('TASCHENTUCHBAUM', 'Taschentuchbaum'),
	('TATAREN-AHORN', 'Tataren-Ahorn'),
	(
		'TRAUBEN-EICHE - WINTER-EICHE',
		'Trauben-Eiche - Winter-Eiche'
	),
	('TRAUBEN-KIRSCHE', 'Trauben-Kirsche'),
	('TROMPETENBAUM', 'Trompetenbaum'),
	('TULPENBAUM', 'Tulpenbaum'),
	('TULPENMAGNOLIE', 'Tulpenmagnolie'),
	(
		'TUPELOBAUM - NYMPHENBAUM',
		'Tupelobaum - Nymphenbaum'
	),
	('ULME', 'Ulme'),
	('UNBEKANNT', 'Unbekannt'),
	('UNGARISCHE EICHE', 'Ungarische Eiche'),
	('URWELTMAMMUTBAUM', 'Urweltmammutbaum'),
	(
		'VIELFIEDRIGE EBERESCHE',
		'Vielfiedrige Eberesche'
	),
	('WALNUSS', 'Walnuss'),
	('WEIDE', 'Weide'),
	('WEIDENBLÄTTRIGE BIRNE', 'Weidenblättrige Birne'),
	('WEISSER MAULBEERBAUM', 'Weißer Maulbeerbaum'),
	(
		'WEISSRINDIGE HIMALAJA-BIRKE - SCHNEE-BIRKE',
		'Weißrindige Himalaja-Birke - Schnee-Birke'
	),
	('WEISSTANNE', 'Weißtanne'),
	(
		'WESTLICHE BALSAM-PAPPEL',
		'Westliche Balsam-Pappel'
	),
	('WINTER-LINDE', 'Winter-Linde'),
	(
		'Winterapfel ''Goldparmäne''',
		'Winterapfel ''Goldparmäne'''
	),
	('ZERR-EICHE', 'Zerr-Eiche'),
	('ZIERAPFEL', 'Zierapfel'),
	('ZIERAPFEL ''LISET''', 'Zierapfel ''Liset'''),
	(
		'ZIERKIRSCHE ''ACCOLADE''',
		'Zierkirsche ''Accolade'''
	),
	(
		'ZIERKIRSCHE ''AUTUMNALIS''',
		'Zierkirsche ''Autumnalis'''
	),
	('ZITTER-PAPPEL, ESPE', 'Zitter-Pappel, Espe'),
	('ZUCKER-AHORN', 'Zucker-Ahorn'),
	(
		'ZWEIGRIFFLIGER WEISSDORN',
		'Zweigriffiger Weißdorn'
	);
-- Then update the main table
UPDATE temp_trees t
SET baumart_de = m.new_name
FROM tree_name_mapping m
WHERE t.baumart_de = m.old_name;
-- Clean up
DROP TABLE tree_name_mapping;
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
-- remove all empty strings from art_dtsch
UPDATE temp_trees
SET art_dtsch = NULL
WHERE art_dtsch ~ '^\s+$'
	OR art_dtsch = '';
-- remove all rows where art_dtsch is 'UNBEKANNT'
UPDATE temp_trees
set art_dtsch = null
where art_dtsch = 'UNBEKANNT';
-- stammumfang
UPDATE temp_trees
SET stammumfg = stammumfan::text
WHERE stammumfg IS NULL
	AND stammumfan IS NOT NULL;
-- First create the mapping table