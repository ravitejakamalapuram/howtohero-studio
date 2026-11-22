#!/usr/bin/env bash
# The Anaadi art is not in git (about 85 MB of PNG). This packs it for a backup and checks a restored copy.
#   ops/assets.sh pack [SRC] [OUT.tar.gz]   tar the art folders (default SRC /mnt/project-files, OUT ./anaadi-art.tar.gz)
#   ops/assets.sh verify [ROOT]             check every file against ops/anaadi-art.sha256 (default ROOT /mnt/project-files)
set -euo pipefail
cd "$(dirname "$0")"; here=$PWD
case "${1:-}" in
  pack) src=${2:-/mnt/project-files}; out=$(realpath -m "${3:-anaadi-art.tar.gz}")
        (cd "$src" && cut -d' ' -f3- "$here/anaadi-art.sha256" | tr '\n' '\0' | xargs -0 tar czf "$out") && sha256sum "$out";;
  verify) root=${2:-/mnt/project-files}; (cd "$root" && sha256sum -c --quiet "$here/anaadi-art.sha256") && echo "all art files match";;
  *) sed -n 2,4p "$0"; exit 2;;
esac
