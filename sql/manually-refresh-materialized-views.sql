-- Manually refresh all materialized views
REFRESH MATERIALIZED VIEW CONCURRENTLY total_tree_species_count;
REFRESH MATERIALIZED VIEW CONCURRENTLY most_frequent_tree_species;
REFRESH MATERIALIZED VIEW CONCURRENTLY trees_count;