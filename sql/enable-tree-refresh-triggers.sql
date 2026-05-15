-- ABOUTME: Re-enables tree materialized-view refresh triggers after bulk updates.
-- ABOUTME: Refreshes tree materialized views once after delete-trees and upsert-trees.

ALTER TABLE public.trees ENABLE TRIGGER tg_refresh_trees_count_mv;
ALTER TABLE public.trees ENABLE TRIGGER tg_refresh_most_frequent_tree_species_mv;
ALTER TABLE public.trees ENABLE TRIGGER tg_refresh_total_tree_species_count_mv;

REFRESH MATERIALIZED VIEW CONCURRENTLY public.trees_count;
REFRESH MATERIALIZED VIEW CONCURRENTLY public.most_frequent_tree_species;
REFRESH MATERIALIZED VIEW CONCURRENTLY public.total_tree_species_count;
