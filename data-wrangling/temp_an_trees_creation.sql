-- -------------------------------------------------------------
-- TablePlus 5.9.7(547)
--
-- https://tableplus.com/
--
-- Database: postgres
-- Generation Time: 2024-04-20 16:53:41.5620
-- -------------------------------------------------------------


DROP TABLE IF EXISTS "public"."temp_an_trees";
-- This script only contains the table creation statements and does not fully represent the table in the database. Do not use it as a backup.

-- Table Definition
CREATE TABLE "public"."temp_an_trees" (
    "gmlid" text,
    "baumid" text,
    "standortnr" text,
    "kennzeich" text,
    "namenr" text,
    "artdtsch" text,
    "artbot" text,
    "gattungdeutsch" text,
    "gattung" text,
    "art_gruppe" text,
    "pflanzjahr" int4,
    "standalter" text,
    "stammumfg" text,
    "bezirk" text,
    "eigentuemer" text,
    "kronedurch" text,
    "baumhoehe" text,
    "geom" geometry(Geometry,4326)
);

