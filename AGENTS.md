<!-- ABOUTME: Project-specific instructions for coding agents in this repository. -->
<!-- ABOUTME: Defines handling rules for large GeoJSON files under data-wrangling/2026. -->

# AGENTS

## Large GeoJSON files

- Files under `data-wrangling/2026/*.geojson` are large.
- Never read these files fully into memory.
- Never read any `.geojson` file fully into memory in this repository.
- For inspection, prefer `jq` on the command line.
- If custom tooling is needed, write `.ts` scripts that stream or process in chunks.
- Do not use full-file parsing patterns like `JSON.parse(await readFile(...))` for GeoJSON.
