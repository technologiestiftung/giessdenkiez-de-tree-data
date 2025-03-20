# Define a function to set up your Node.js script completions for npx giessdenkiez
function setup_giessdenkiez_completions --description 'Set completions for npx giessdenkiez'
    # Define options and their descriptions
    complete -c npx -n '__fish_seen_subcommand_from giessdenkiez' -a '-h --help' -d 'Output usage information and exit.'
    complete -c npx -n '__fish_seen_subcommand_from giessdenkiez' -a '-c --create-temp-table' -d 'Create a new table temp_trees and exit. Default is false.'

    # Import GeoJSON path completion
    complete -c npx -n '__fish_seen_subcommand_from giessdenkiez' -l import-geojson -x -a '(__fish_complete_path)' -d 'Specify the path to the GeoJSON file you want to import.'

    complete -c npx -n '__fish_seen_subcommand_from giessdenkiez' -a '-d --delete-trees' -d 'Delete all trees from the database that are not in the temp_trees.'
    complete -c npx -n '__fish_seen_subcommand_from giessdenkiez' -a '-m --comment' -d 'Specify the comment for the trees when inserted into the database.'
    complete -c npx -n '__fish_seen_subcommand_from giessdenkiez' -a '-u --upsert-trees' -d 'Upsert all trees from the temp_trees into the database.'
    complete -c npx -n '__fish_seen_subcommand_from giessdenkiez' -a '-r --dry-run' -d 'Perform a dry run. Default is false.'
    complete -c npx -n '__fish_seen_subcommand_from giessdenkiez' -a '-t --set-tree-type' -d 'Specify the type of tree during import, can be "anlage" or "strasse". Default is null.'
    complete -c npx -n '__fish_seen_subcommand_from giessdenkiez' -a '--get-wfs-data' -d 'Make a web request to the WFS server and save the data to a file.'
    complete -c npx -n '__fish_seen_subcommand_from giessdenkiez' -a '--clean-up' -d 'Removes all temp tables.'
    complete -c npx -n '__fish_seen_subcommand_from giessdenkiez' -a '--pghost' -d 'Specify the PostgreSQL host. Default is the value of the PGHOST environment variable.'
    complete -c npx -n '__fish_seen_subcommand_from giessdenkiez' -a '--pgport' -d 'Specify the PostgreSQL port. Default is the value of the PGPORT environment variable.'
    complete -c npx -n '__fish_seen_subcommand_from giessdenkiez' -a '--pguser' -d 'Specify the PostgreSQL user. Default is the value of the PGUSER environment variable.'
    complete -c npx -n '__fish_seen_subcommand_from giessdenkiez' -a '--pgpassword' -d 'Specify the PostgreSQL password. Default is the value of the PGPASSWORD environment variable.'
    complete -c npx -n '__fish_seen_subcommand_from giessdenkiez' -a '--pgdatabase' -d 'Specify the PostgreSQL database. Default is the value of the PGDATABASE environment variable.'
    complete -c npx -n '__fish_seen_subcommand_from giessdenkiez' -a '--temp-trees-tablename' -d 'Specify the name of the temporary trees table. Default is "temp_trees".'
end

# Call the function to set up the completions
setup_giessdenkiez_completions
