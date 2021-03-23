# Giessdenkiez.de Tree data 




## Inputs 

### `outfile-path`

**Required** The path where the GeoJSON file should be written to. Default `"public/data/pumps.geojson"`.

## Outputs

### `file`

The path to where the file was written.

## Example Usage


## Development

See also https://docs.github.com/en/actions/creating-actions/creating-a-docker-container-action

### Python

Run the script with `python3 harvester/main.py path/to/out/file.geojson`

### Docker  

Build the container and run it.

```bash
mkdir out
docker build --tag technologiestiftung/giessdenkiez-de-osm-pumpen-harvester .
docker run -v $PWD/out:/scripts/out technologiestiftung/giessdenkiez-de-osm-pumpen-harvester path/scripts/out/outfile.json
```

### Test

```bash
pytest
pytest --cov=harvester --cov-fail-under 75 --cov-config=.coveragerc
```
