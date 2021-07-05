#!/bin/bash
set -e

root="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"

fields="$root/taxes/f8949.fields"
form="$root/taxes/f8949.pdf"
output="/tmp/f8949.pdf"

cd /tmp

for input in $(find "/tmp" -type f -name "f8949-*.json" | sort -t '/' -k 4 -n | tr '\n\r' ' ')
do

  page=$(basename "${input#*-}" .json)
  fdf="/tmp/f8949-$page.fdf"
  out="/tmp/f8949-$page.pdf"

  if [[ ! -f "$input" ]]
  then echo "No input file detected at $input" && continue;
  fi

  rm -rf "$fdf" "$out"

  echo "python ops/fill-form.py $input $fields $fdf"

  python "$root/taxes/fill-form.py" "$input" "$fields" "$fdf"

  echo "pdftk $form fill_form $fdf output $out flatten"

  pdftk "$form" fill_form "$fdf" output "$out" flatten

done

all_pages="$(find "/tmp" -type f -name "f8949-*.pdf" | sort -t '/' -k 4 -n | tr '\n\r' ' ')"
echo "Compiling pages: $all_pages"
# shellcheck disable=SC2086
pdftk $all_pages cat output "$output"
