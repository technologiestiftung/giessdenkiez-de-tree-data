_giessdenkiez_completions()
{
    local cur=${COMP_WORDS[COMP_CWORD]}
    local opts="-h --help -c --create-temp-table -i --import-geojson -d --delete-trees -m --comment -u --upsert-trees -r --dry-run -t --set-tree-type -n --temp-trees-tablename --get-wfs-data --test-connection --clean-up --pghost --pgport --pguser --pgpassword --pgdatabase"

    COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
}

complete -F _giessdenkiez_completions giessdenkiez