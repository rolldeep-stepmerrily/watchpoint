#!/usr/bin/env bash
set -euo pipefail

REGISTERED="d-va echo hazard juno lifeweaver lucio mercy pharah reaper wrecking-ball hanzo brigitte moira cassidy"
KR_ONLY="domina anran emre vendetta jetpack-cat mizuki wuyang"
SKIP="$REGISTERED $KR_ONLY"

is_skip() {
  local cn=$1
  for s in $SKIP; do [[ "$s" == "$cn" ]] && return 0; done
  return 1
}

slug_for() {
  case "$1" in
    d-va) echo "dva" ;;
    *) echo "$1" ;;
  esac
}

codenames=$(docker exec watchpoint-postgres psql -U postgres -d watchpoint -tA -c "select codename from heroes order by codename;")

for cn in $codenames; do
  if is_skip "$cn"; then continue; fi

  slug=$(slug_for "$cn")
  ids=$(curl -sL "https://overwatch.blizzard.com/en-us/heroes/${slug}/" -A "Mozilla/5.0" 2>/dev/null | grep -oE 'blz-tab-control id="[a-z-]+"' | sed 's/blz-tab-control id="//;s/"//' | awk '!seen[$0]++' | paste -sd ',' -)

  ko=$(docker exec watchpoint-postgres psql -U postgres -d watchpoint -tA -c "
    select slot || ':' || name from hero_abilities
    where \"heroId\" = (select id from heroes where codename='$cn')
    order by case slot when 'PRIMARY' then 1 when 'SECONDARY' then 2 when 'ABILITY_1' then 3 when 'ABILITY_2' then 4 when 'ULTIMATE' then 5 when 'PASSIVE' then 6 end;
  ")

  echo "## ${cn}"
  echo "EN cards: ${ids}"
  echo "DB abilities:"
  echo "${ko}" | sed 's/^/  /'
  echo ""

  sleep 0.5
done
