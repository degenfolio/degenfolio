#!/bin/bash
set -e

root="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"

input="/tmp/f8949.json"
fields="$root/taxes/f8949.fields"
fdf="/tmp/f8949.fdf"
form="$root/taxes/f8949.pdf"
output="/tmp/f8949.pdf"

if [[ ! -f "$input" ]]
then echo "No input file detected at $input" && exit 1;
fi

rm -rf "$fdf" "$output"

echo "python ops/fill-form.py $input $fields $fdf"
python "$root/taxes/fill-form.py" "$input" "$fields" "$fdf"

echo "pdftk $form fill_form $fdf output $output flatten"
pdftk "$form" fill_form "$fdf" output "$output" flatten
