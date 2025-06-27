-- -------------------------------------------------------------
-- TablePlus 5.9.7(547)
--
-- https://tableplus.com/
--
-- Database: postgres
-- Generation Time: 2024-04-20 16:52:56.1790
-- -------------------------------------------------------------


DROP TABLE IF EXISTS "public"."temp_trees";
-- This script only contains the table creation statements and does not fully represent the table in the database. Do not use it as a backup.

-- Table Definition
CREATE TABLE "public"."temp_trees" (
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
    "strname" text,
    "hausnr" text,
    "pflanzjahr" int4,
    "standalter" text,
    "stammumfg" text,
    "baumhoehe" text,
    "bezirk" text,
    "eigentuemer" text,
    "zusatz" text,
    "kronedurch" text,
    "geom" geometry(Geometry,4326)
);

