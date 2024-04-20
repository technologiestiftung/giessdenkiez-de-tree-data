![](https://img.shields.io/badge/Built%20with%20%E2%9D%A4%EF%B8%8F-at%20Technologiestiftung%20Berlin-blue)

# Gieß den Kiez Tree data

_This is a script to harvest tree data from a Web Feature Service from Berlins Geodata Portal and integrate it to our Gieß-den-Kiez-database._

In the application [Gieß-den-Kiez.de](https://giessdenkiez.de), Berlin's street trees are displayed on a map. The data about the trees comes from Berlin's street and green space offices and is made available as open data via Berlin's Geodata portal, the [FIS-Broker](https://fbinter.stadt-berlin.de/fb/index.jsp). The underlying database, the green space information system (GRIS), is continuously maintained by the administration: Trees not yet recorded and newly planted trees are entered and felled trees are deleted. The data set is then updated in the Geodata portal once a year, always in spring. In order to reflect the current status, the data in Gieß den Kiez is therefore also updated once a year when the new [tree dataset](https://fbinter.stadt-berlin.de/fb/index.jsp?loginkey=zoomStart&mapId=k_wfs_baumbestand@senstadt&bbox=389138,5819243,390887,5820322) is published.

We use these Python scripts to automate this. Using the script `get_data_from_wfs.py`, the data can be downloaded from the FIS-Broker in GeoJSON format and saved locally. Using `main.py` we connect to our Gieß-den-Kiez database and the data is then compared with the existing tree data of the database using their GML-IDs (also called technical IDs in the FIS-Broker). In this way, deleted and added trees are identified and removed or added from the database. All matching trees are also identified and updated for the columns specified in `config.yml`.

![tree_data_schema](https://user-images.githubusercontent.com/61182572/124777121-44cb3080-df40-11eb-9e49-4cccad77b821.png)

## Requirements

- Python >= 3.9
- GDAL (as a dependency for geopandas)
- Docker (optional bat easier to handle)

To make sure we have a consistent environment, we created a docker image with all dependencies installed. We do not recommend running this on your host machine. To build the image, run:

```bash
docker build -t technologiestiftung/giessdenkiez-de-tree-data .
```

This image will create a container where you can run an interactive shell session. It will not run any scripts. First copy or rename the `tree_data/sample.env` to `tree_data/.env` and populate it with the right variables. Then run the container in detached mode:

```bash
docker run --name gdk-python-runner --detach \
		--env-file $(pwd)/.env \
		--volume "$(pwd)/tree_data:/usr/app/tree_data" \
		technologiestiftung/giessdenkiez-de-tree-data
```

The above command will create a container named `gdk-python-runner` with the environment variables from the `.env` file and the `tree_data` directory mounted inside the container. Any change you make to the `tree_data` directory will be reflected inside the container.

Then you can run the scripts inside the container:

```bash
docker exec -it gdk-python-runner /bin/bash
cd /usr/app/
# download the data
python tree_data/get_data_from_wfs.py
# update the database
# make sure to update the tree_data/conf.yml file with the correct filenames
python tree_data/main.py

```

For convinence see the [Makefile](./Makefile) for more commands.

Currently

```bash
# build the image
make build
# run the container
make run
# run ineractive tty session
make shell
# remove the container
make clean
```

## Inputs

- New tree data in GML or GeoJSON format
- config.yaml that configurates paths, tablesnames, overwritting, mapping of column names and columns to update

```yml
database:
  parameter-path: .env
  data-table-name: trees
  replace-table: True

new-data-files:
  - s_wfs_baumbestand-YYYY-M-DD.geo.json
  - s_wfs_baumbestand_an-YYYY-M-DD.geo.json

data-schema:
  mapping:
    art_bot: artbot
    art_dtsch: artdtsch
    gattung_deutsch: gattungdeutsch
    gml_id: gmlid
  merge-on:
    - gmlid
  update:
    - standalter
    - baumhoehe
    - kronedurch
    - stammumfg
    - gmlid
    - lat
    - lng
    - standortnr
    - kennzeich
    - artdtsch
    - artbot
    - gattungdeutsch
    - gattung
    - pflanzjahr
```

- .env that contains database credentials

```yml
PGHOST=
PGPORT=
PGUSER=
PG_PASSWORD=
PGDATABASE=
```

## Example Usage

- Install requirements

```bash
pip install -r requirements.txt
```

- Download newest tree data from the FIS-Broker. Locally run:

```bash
python tree_data/get_data_from_wfs.py
```

2. Step: Set filename and current year in the `conf.yml`

```yml
year: 23

new-data-files:
  - s_wfs_baumbestand_YYYY-MM-DD.geo.json
  - s_wfs_baumbestand_an_YYYY-MM-DD.geo.json
```

3. Step: Configure you environment using the variables in `.env` file and provide the credentials of your production database. We recommend using something like [direnv](https://direnv.net/) to manage your environment variables.

4. Step: Execute `main.py` to connect to your production database and finally update the database:

```bash
python tree_data/main.py
```

## Updating Caretaker labels

In Gieß den Kiez it is visible which trees are maintained by Berlin's street and green space offices. However, this information is not included in the offical Berlin tree dataset. Instead, Berlin's green space offices provide separate Excel tables containing the trees they water. This information needs to be entered 'manually' into the database table "trees" using SQL commands. The procedure is as follows:

1. Extract only the FIS-Broker-ID'S (gmlids) from the Excel sheet to a csv file
2. Create a new table with this ID's in the database: `CREATE TABLE caretaker_ids(id VARCHAR NOT NULL)`
3. Import ID’s from CSV-Table into the database table
4. Delete old caretaker labels from the trees table: `UPDATE trees SET caretaker = NULL`
5. JOIN new caretaker labels to the trees: `UPDATE trees t SET caretaker = 'Bezirk XY' FROM caretaker_ids c WHERE t.gmlid = c.id`
6. Delete the no longer needed table: `DROP TABLE caretaker_ids`

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Lisa-Stubert"><img src="https://avatars.githubusercontent.com/u/61182572?v=4?s=64" width="64px;" alt="Lisa-Stubert"/><br /><sub><b>Lisa-Stubert</b></sub></a><br /><a href="#data-Lisa-Stubert" title="Data">🔣</a> <a href="https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commits?author=Lisa-Stubert" title="Code">💻</a> <a href="https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commits?author=Lisa-Stubert" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/vogelino"><img src="https://avatars.githubusercontent.com/u/2759340?v=4?s=64" width="64px;" alt="Lucas Vogel"/><br /><sub><b>Lucas Vogel</b></sub></a><br /><a href="https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commits?author=vogelino" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/julizet"><img src="https://avatars.githubusercontent.com/u/52455010?v=4?s=64" width="64px;" alt="Julia Zet"/><br /><sub><b>Julia Zet</b></sub></a><br /><a href="https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commits?author=julizet" title="Code">💻</a> <a href="https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commits?author=julizet" title="Documentation">📖</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

## Credits

<table>
  <tr>
    <td>
      <a src="https://citylab-berlin.org/en/start/">
        <br />
        <br />
        <img width="200" src="https://logos.citylab-berlin.org/logo-citylab-berlin.svg" />
      </a>
    </td>
    <td>
      A project by: <a src="https://www.technologiestiftung-berlin.de/en/">
        <br />
        <br />
        <img width="150" src="https://logos.citylab-berlin.org/logo-technologiestiftung-berlin-en.svg" />
      </a>
    </td>
    <td>
      Supported by:
      <br />
      <br />
      <img width="120" src="https://logos.citylab-berlin.org/logo-berlin.svg" />
    </td>
  </tr>
</table>
