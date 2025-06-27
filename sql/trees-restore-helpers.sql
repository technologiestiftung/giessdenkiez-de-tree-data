-- The trees table has some triggers that need to disabled if you want to fully restore the table from a backup.
-- This is meant for local development. We should not need this in production.
ALTER TABLE trees DISABLE TRIGGER tg_refresh_trees_count_mv;
ALTER TABLE trees DISABLE TRIGGER tg_refresh_most_frequent_tree_species_mv;
ALTER TABLE trees DISABLE TRIGGER tg_refresh_total_tree_species_count_mv;
-- After restore is done, re-enable our specific triggers
ALTER TABLE trees ENABLE TRIGGER tg_refresh_trees_count_mv;
ALTER TABLE trees ENABLE TRIGGER tg_refresh_most_frequent_tree_species_mv;
ALTER TABLE trees ENABLE TRIGGER tg_refresh_total_tree_species_count_mv;