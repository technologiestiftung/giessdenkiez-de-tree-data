![](https://img.shields.io/badge/Build%20with%20%E2%9D%A4%EF%B8%8F-at%20Technologiesitftung%20Berlin-blue)

# Gieß den Kiez Tree data 

*This is a script to harvest tree data from a Web Feature Service from Berlins Geodata Portal and integrate it to our Gieß-den-Kiez-database.*

In the application [Gieß-den-Kiez.de](https://giessdenkiez.de), Berlin's street trees are displayed on a map. The data about the trees comes from Berlin's street and green space offices and is made available as open data via Berlin's Geodata portal, the [FIS-Broker](https://fbinter.stadt-berlin.de/fb/index.jsp). The underlying database, the green space information system (GRIS), is continuously maintained by the administration: Trees not yet recorded and newly planted trees are entered and felled trees are deleted. The data set is then updated in the Geodata portal once a year, always in spring. In order to reflect the current status, the data in Gieß den Kiez is therefore also updated once a year when the new [tree dataset](https://fbinter.stadt-berlin.de/fb/index.jsp?loginkey=zoomStart&mapId=k_wfs_baumbestand@senstadt&bbox=389138,5819243,390887,5820322) is published.

We use these Python scripts to automate this. Using the script `get_data_from_wfs.py`, the data can be downloaded from the FIS-Broker in GeoJSON format and saved locally. Using `main.py` we connect to our Gieß-den-Kiez database and the data is then compared with the existing tree data of the database using their GML-IDs (also called technical IDs in the FIS-Broker). In this way, deleted and added trees are identified and removed or added from the database. All matching trees are also identified and updated for the columns specified in `config.yml`.

![tree_data_schema](https://user-images.githubusercontent.com/61182572/124777121-44cb3080-df40-11eb-9e49-4cccad77b821.png)

## Inputs 

- New tree data in GML or GeoJSON format
- config.yaml that configurates paths, tablesnames, overwritting, mapping of column names and columns to update
```yml
database:
  parameter-path: .env
  data-table-name: trees
  replace-table: True

new-data-paths:
  - tree_data/data_files/s_wfs_baumbestand.gml
  - tree_data/data_files/s_wfs_baumbestand_an.gml

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
PG_SERVER=
PG_PORT=
PG_USER=
PG_PASS=
PG_DB=
```

## Example Usage

To save newest tree data from the FIS-Broker locally run
```bash
python tree_data/get_data_from_wfs.py
```
To update database run
```bash
python tree_data/main.py
```


## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/Lisa-Stubert"><img src="https://avatars.githubusercontent.com/u/61182572?v=4?s=64" width="64px;" alt=""/><br /><sub><b>Lisa-Stubert</b></sub></a><br /><a href="#data-Lisa-Stubert" title="Data">🔣</a> <a href="https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commits?author=Lisa-Stubert" title="Code">💻</a> <a href="https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commits?author=Lisa-Stubert" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/vogelino"><img src="https://avatars.githubusercontent.com/u/2759340?v=4?s=64" width="64px;" alt=""/><br /><sub><b>Lucas Vogel</b></sub></a><br /><a href="https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commits?author=vogelino" title="Documentation">📖</a></td>
  </tr>
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
