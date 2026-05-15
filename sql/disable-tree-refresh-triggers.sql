-- ABOUTME: Disables tree materialized-view refresh triggers for bulk updates.
-- ABOUTME: Use before delete-trees and upsert-trees, then run enable-tree-refresh-triggers.sql.

ALTER TABLE public.trees DISABLE TRIGGER tg_refresh_trees_count_mv;
ALTER TABLE public.trees DISABLE TRIGGER tg_refresh_most_frequent_tree_species_mv;
ALTER TABLE public.trees DISABLE TRIGGER tg_refresh_total_tree_species_count_mv;
