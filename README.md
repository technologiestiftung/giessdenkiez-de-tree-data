![](https://img.shields.io/badge/Built%20with%20%E2%9D%A4%EF%B8%8F-at%20Technologiestiftung%20Berlin-blue)

# Gieß den Kiez Tree data

_This is a script to harvest tree data from a Web Feature Service from Berlins Geodata Portal and integrate it to our Gieß-den-Kiez-database._

In the application [Gieß-den-Kiez.de](https://giessdenkiez.de), Berlin's street trees are displayed on a map. The data about the trees comes from Berlin's street and green space offices and is made available as open data via Berlin's Geodata portal, the [FIS-Broker](https://fbinter.stadt-berlin.de/fb/index.jsp). The underlying database, the green space information system (GRIS), is continuously maintained by the administration: Trees not yet recorded and newly planted trees are entered and felled trees are deleted. The data set is then updated in the Geodata portal once a year, always in spring. In order to reflect the current status, the data in Gieß den Kiez is therefore also updated once a year when the new [tree dataset](https://fbinter.stadt-berlin.de/fb/index.jsp?loginkey=zoomStart&mapId=k_wfs_baumbestand@senstadt&bbox=389138,5819243,390887,5820322) is published.

We use these Python and Node.js to automate this. Using the script `get_data_from_wfs.py`, the data can be downloaded from the FIS-Broker in GeoJSON format and saved locally.

Using a Node.js cli we do the following steps:

1. Create a new temporary table in the database
2. Insert the geojson data into the temporary table
3. Delete all trees that are no longer in the new dataset
4. Update and Insert (upsert) all trees that are in the new dataset
5. Clean up the temporary table

## Requirements

- Python >= 3.9
- Node.js >= 20 (we recommend using [nvm](https://nvm.sh) to manage your Node.js versions)
- GDAL (as a dependency for geopandas)
- Docker (optional bat easier to handle)

## Usage

### Environment Variables

We do not make assumptions how your environment loads variables. At Technologiestiftung we use [direnv](https://direnv.net/) to manage our environment variables. You can also use a `.env` file to store your environment variables and load it with [the `--env-file` flag from Node.js](https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs).

`.env` contains database credentials.

```plain
PGHOST=
PGPORT=
PGUSER=
PG_PASSWORD=
PGDATABASE=
```

### Data Download with Python

> [!WARNING] This will be removed and should be replaced with the Node.js script.

To make sure we have a consistent environment, we created a docker image with all dependencies for the python scripts installed. We do not recommend running this on your host machine. To build the image, run:

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
```

For convinence see the [Makefile](./Makefile) for more commands.

### Data Processing with Node.js

As outlined above we have to do several steps to process the data.
First install all dependencies:

```bash
# install node 20
nvm use
# install dependencies
npm ci
```

We currently have not defined a build step yet. Execute the cli using tsx as loader for Node.js.

```bash
node --import tsx src/cli.ts
```

To see the help message run:

```bash
node --import tsx src/cli.ts --help
```

Below are the main steps you need to take to update the database. Each step should be run separately. This allows to chech in between if everything is working as expected. We recommend to run the steps in the following order:

1. create-temp-table
2. import-geojson
3. delete-trees
4. upsert-trees
5. clean-up

Test your process on a local version of the database before running it on the production database.

#### Create a new temporary table in the database

The name of the temporary table is `temp_trees` is currently hardcoded src/config.ts

```bash
node --import tsx src/cli.ts  --create-temp-table
```

#### Insert the geojson data into the temporary table

The download will generate two files for you. One for the "anlage" trees one for the "strasse" trees. You need import them separately. using the --set-tree-type flag you can set the tree type.
The file names will differ depending on the date you downloaded the data.

```bash
node --import tsx src/cli.ts --import-geojson=./tree_data/data_files/s_wfs_baumbestand_an_2024-4-19.geo.json --set-tree-type=anlage
node --import tsx src/cli.ts --import-geojson=./tree_data/data_files/s_wfs_baumbestand_2024-4-19.geo.json --set-tree-type=strasse
```

#### Delete all trees that are no longer in the new dataset

This will remove all trees from the table `trees` that are not in the temporary table `temp_trees`. It will also clean out the tables `trees_adopted` and `trees_watered`.

```bash
node --import tsx src/cli.ts --delete-trees
```

#### Update and Insert (upsert) all trees that are in the new dataset

This will update all trees that are in the temporary table `temp_trees` and insert all trees that are not in the table `trees`.

```bash
node --import tsx src/cli.ts --upsert-trees
```

#### Clean up the temporary table

This will drop the temporary table `temp_trees`.

```bash
node --import tsx src/cli.ts --clean-up
```

## Updating Caretaker labels

In Gieß den Kiez it is visible which trees are maintained by Berlin's street and green space offices. However, this information is not included in the offical Berlin tree dataset. Instead, Berlin's green space offices provide separate Excel tables containing the trees they water. This information needs to be entered 'manually' into the database table "trees" using SQL commands. The procedure is as follows:

1. Extract only the FIS-Broker-ID'S (gml_ids) from the Excel sheet to a csv file
2. Create a new table with this ID's in the database: `CREATE TABLE caretaker_ids(id VARCHAR NOT NULL)`
3. Import ID’s from CSV-Table into the database table
4. Delete old caretaker labels from the trees table: `UPDATE trees SET caretaker = NULL`
5. JOIN new caretaker labels to the trees: `UPDATE trees t SET caretaker = 'Bezirk XY' FROM caretaker_ids c WHERE t.gmlid = c.id`
6. Delete the no longer needed table: `DROP TABLE caretaker_ids`

## Testing

To generate some test data you can run this script:

```bash
npm run test:generate:geojson -- --input-file ./tree_data/data_files/s_wfs_baumbestand_2024-4-19.geo.json --output-file ./tests/data/test.geo.json --count 10
```

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
