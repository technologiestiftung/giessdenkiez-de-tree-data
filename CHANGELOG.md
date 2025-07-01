# [1.5.0](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/compare/v1.4.0...v1.5.0) (2025-07-01)


### Bug Fixes

* Clean up SQL script for temp_trees table ([0dbb3ed](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commit/0dbb3ed53e5f4ae8095de5b7a657f7b60e2372d5))
* cli help text ([27523ff](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commit/27523ff64f9444c0fc4fee8c35f78ea10b580d7c))
* Correct SQL transformation for GeoJSON geometry ([05b81b6](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commit/05b81b6fc019fcbd04dd1202f90bc08a02a021a1))


### Features

* Add CLI completions for npx giessdenkiez ([153cc29](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commit/153cc293f6150e0644b0e94f8730a36df668fcca))
* Add comment option for tree import ([cf3581f](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commit/cf3581f24adef94d04423169d7dddc4d9012893c))
* Add completions for giessdenkiez CLI commands in zsh & bash ([f25d71b](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commit/f25d71b97ad8be9f80248591aa539bc751b22ff5))
* Add default cursor behaviour rules for interaction guidelines ([e35c874](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commit/e35c874881be9e38a6c65c0ef70f929a007c8649))
* Add languages.mdc file for TypeScript project configuration ([cbf80a0](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commit/cbf80a00efad772531b88f543224a0c2a29d96d5))
* Add Postgres dependency and enhance map functionality ([c596808](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commit/c59680894860650674abb433de754b11591bde11))
* Add processed column to trees table and update upsertTrees logic ([b79bb69](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commit/b79bb69fc17e57d616ce220ad51d394412415a8a))
* Add SQL scripts for materialized view refresh and trees table restore ([b7488bd](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commit/b7488bd3263ab0a0b7506d159b7b230ffab814c8))
* Add test connection feature to CLI for PostgreSQL ([f5045ea](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commit/f5045ea0c42e0c6cc7ac426ce45852c6d2531fdb))
* Adjust upsertTrees function for improved performance and deadlock prevention ([54636f3](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commit/54636f3e97eb9053c9586e9ea8eb335acc065c22))
* Enhance dry-run functionality across database operations ([accd098](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commit/accd0984357305fcec8fd113f824324ce474fe23))
* Enhance upsertTrees function with improved batch processing and logging ([e0efe92](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commit/e0efe926c13346f7023c20b8f358a250d9a22106))
* Improve deleteTrees function with dry-run support and enhanced logging ([e87c3a5](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commit/e87c3a507462da2c382caa4c288b5653e981b3e1))
* Introduced "bin" entry for CLI command "giessdenkiez" in both package.json and package-lock.json. ([3bbc0b6](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commit/3bbc0b6a0b49a1e7f3cac849497682179bd1f584))
* Update CLI to support temporary trees table option ([f4613cb](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commit/f4613cb747ce067b28409147c9fdea1941b182fb))

# [1.4.0](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/compare/v1.3.0...v1.4.0) (2024-05-07)


### Features

* Upsert in batches to prevent timeouts ([a1d5ea2](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commit/a1d5ea2b925b2e34779df614c8fd064db4cbc24d))

# [1.3.0](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/compare/v1.2.0...v1.3.0) (2024-05-07)


### Features

* Delete in batches to prevent timeouts ([f59ee70](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commit/f59ee706eb4fe7c69f47e1db4cb9735c3c44c389))

# [1.2.0](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/compare/v1.1.0...v1.2.0) (2024-05-06)


### Bug Fixes

* **.env:** Move .env to root of repo ([3dac80d](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commit/3dac80d65d7148aa28c731ba8f22bbb1aa541e04))
* Rename ext geojson to json ([bf1b081](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commit/bf1b081881dbbe406e70f4b0ccf0e47fb344f7f8))
* **upsert:** Query does upsert now ([3d1b9d5](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commit/3d1b9d5dd51bdbc0fdd3e65023f25432c3142ad9))


### Features

* App error type ([d3bf334](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commit/d3bf334a910245fd227ef8840f5bf3ca82354814))
* **importer:** Adds WIP state of importer CI ([3c36b4d](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commit/3c36b4d5cc9692e1b8c50de7af63e86173c811c0))
* Make connection options non optional ([091781b](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commit/091781b7f06d158e9ae7c502ac6b1d68c6cd7777))

# [1.1.0](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/compare/v1.0.1...v1.1.0) (2024-04-20)


### Features

* Select trees in batches ([51e8554](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commit/51e8554a5667e127f2a84007b08f1b25dd8f490b))

## [1.0.1](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/compare/v1.0.0...v1.0.1) (2024-04-19)


### Bug Fixes

* **env:** Rename env vars to match PG pattern ([534f56b](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commit/534f56b007d6664cd982038493160fd0d7db2074))

# 1.0.0 (2024-03-27)


### Bug Fixes

* cast dtype of pflanzjahr to int4 ([39c0256](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commit/39c02569934342b1f61b4c65bc68cc55cd90665b))
* drop 646 new trees with duplicated gmlid ([30b68e0](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commit/30b68e028a361da950bdb48123785598662012cb))
* typo in badge ([8dcc5d5](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commit/8dcc5d5067536bf69b165dd871d832d54c774451))
* Update dependencies to working state ([a251a74](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commit/a251a7433e9c21855eff61fd69e4ce66de22e851))
* Use more expressive path handling ([2ca1c7b](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commit/2ca1c7b57493226ef9f00b1b0c55b665865544f0))


### Features

* Add Docker for reproduceability ([69e59af](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commit/69e59afc59a577a8fec93b6d58cf16d2ac1a556b))
* **data:** Add tree data from 2022 as csv to repo ([d1e6ae2](https://github.com/technologiestiftung/giessdenkiez-de-tree-data/commit/d1e6ae24854bc338bce094bdfb850e8c473681d7))
