#!/usr/bin/env bash
set -e

root=$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )
project=$(grep -m 1 '"name":' "$root/package.json" | cut -d '"' -f 4)

# turn on swarm mode if it's not already on
docker swarm init 2> /dev/null || true
docker network create --attachable --driver overlay "$project" 2> /dev/null || true

if grep -qs "$project" <<<"$(docker stack ls | tail -n +2)"
then echo "$project stack is already running" && exit
fi
    
####################
# External Env Vars

# shellcheck disable=SC1091
if [[ -f .env ]]; then source .env; fi

DEGENFOLIO_DOMAINNAME="${DEGENFOLIO_DOMAINNAME:-}"
DEGENFOLIO_EMAIL="${DEGENFOLIO_EMAIL:-noreply@gmail.com}"
DEGENFOLIO_ETH_PROVIDER="${DEGENFOLIO_ETH_PROVIDER:-}"
DEGENFOLIO_ETHERSCAN_KEY="${DEGENFOLIO_ETHERSCAN_KEY:-}"
DEGENFOLIO_LOG_LEVEL="${DEGENFOLIO_LOG_LEVEL:-info}"
DEGENFOLIO_PORT="${DEGENFOLIO_PORT:-3000}"
DEGENFOLIO_PROD="${DEGENFOLIO_PROD:-false}"
DEGENFOLIO_SEMVER="${DEGENFOLIO_SEMVER:-false}"

# alias env var to override what's in .env
DEGENFOLIO_LOG_LEVEL="${LOG_LEVEL:-$DEGENFOLIO_LOG_LEVEL}";

# If semver flag is given, we should ensure the prod flag is also active
if [[ "$DEGENFOLIO_SEMVER" == "true" ]]
then export DEGENFOLIO_PROD=true
fi

echo "Launching $project in env:"
echo "- DEGENFOLIO_DOMAINNAME=$DEGENFOLIO_DOMAINNAME"
echo "- DEGENFOLIO_EMAIL=$DEGENFOLIO_EMAIL"
echo "- DEGENFOLIO_ETH_PROVIDER=$DEGENFOLIO_ETH_PROVIDER"
echo "- DEGENFOLIO_ETHERSCAN_KEY=$DEGENFOLIO_ETHERSCAN_KEY"
echo "- DEGENFOLIO_LOG_LEVEL=$DEGENFOLIO_LOG_LEVEL"
echo "- DEGENFOLIO_PORT=$DEGENFOLIO_PORT"
echo "- DEGENFOLIO_PROD=$DEGENFOLIO_PROD"
echo "- DEGENFOLIO_SEMVER=$DEGENFOLIO_SEMVER"

####################
# Misc Config

commit=$(git rev-parse HEAD | head -c 8)
semver="v$(grep -m 1 '"version":' "$root/package.json" | cut -d '"' -f 4)"
if [[ "$DEGENFOLIO_SEMVER" == "true" ]]
then version="$semver"
elif [[ "$DEGENFOLIO_PROD" == "true" ]]
then version="$commit"
else version="latest"
fi

common="networks:
      - '$project'
    logging:
      driver: 'json-file'
      options:
          max-size: '100m'"


########################################
# Server config

server_internal_port=8080
server_env="environment:
      VM_ETH_PROVIDER: '$DEGENFOLIO_ETH_PROVIDER'
      DEGENFOLIO_ETHERSCAN_KEY: '$DEGENFOLIO_ETHERSCAN_KEY'
      DEGENFOLIO_LOG_LEVEL: '$DEGENFOLIO_LOG_LEVEL'
      DEGENFOLIO_PORT: '$server_internal_port'
      DEGENFOLIO_PROD: '$DEGENFOLIO_PROD'
"

if [[ "$DEGENFOLIO_PROD" == "true" ]]
then
  server_image="${project}:$version"
  server_service="server:
    image: '$server_image'
    $common
    $server_env
    volumes:
      - 'data:/data'"

else
  server_image="${project}_builder:$version"
  server_db="$root/.server-db"
  mkdir -p "$server_db"
  server_service="server:
    image: '$server_image'
    $common
    $server_env
    entrypoint: 'bash modules/server/ops/entry.sh'
    volumes:
      - '$root:/root'
      - '$server_db:/data'"

fi
bash "$root/ops/pull-images.sh" "$server_image"

########################################
# Webserver config

webserver_internal_port=3000

if [[ "$DEGENFOLIO_PROD" == "true" ]]
then
  webserver_image="${project}_webserver:$version"
  webserver_service="webserver:
    image: '$webserver_image'
    $common"

else
  webserver_image="${project}_builder:$version"
  webserver_service="webserver:
    image: '$webserver_image'
    $common
    entrypoint: 'npm start'
    environment:
      NODE_ENV: 'development'
      PUBLIC_URL: ''
    volumes:
      - '$root:/root'
    working_dir: '/root/modules/client'"

fi
bash "$root/ops/pull-images.sh" "$webserver_image"

########################################
# Proxy config

proxy_image="${project}_proxy:$version"
bash "$root/ops/pull-images.sh" "$proxy_image"

if [[ -n "$DEGENFOLIO_DOMAINNAME" ]]
then
  public_url="https://$DEGENFOLIO_DOMAINNAME"
  proxy_ports="ports:
      - '80:80'
      - '443:443'"
  echo "${project}_proxy will be exposed on *:80 and *:443"

else
  public_port=${public_port:-3000}
  public_url="http://127.0.0.1:$public_port"
  proxy_ports="ports:
      - '$public_port:80'"
  echo "${project}_proxy will be exposed on *:$public_port"
fi

####################
# Launch It

docker_compose=$root/.docker-compose.yml
rm -f "$docker_compose"
cat - > "$docker_compose" <<EOF
version: '3.4'

networks:
  $project:
    external: true

volumes:
  data:
  certs:

services:

  proxy:
    image: '$proxy_image'
    $common
    $proxy_ports
    environment:
      DOMAINNAME: '$DEGENFOLIO_DOMAINNAME'
      EMAIL: '$DEGENFOLIO_EMAIL'
      SERVER_URL: 'server:$server_internal_port'
      WEBSERVER_URL: 'webserver:$webserver_internal_port'
    volumes:
      - 'certs:/etc/letsencrypt'

  $server_service

  $webserver_service

EOF

docker stack deploy -c "$docker_compose" "$project"

echo "The $project stack has been deployed, waiting for $public_url to start responding.."
timeout=$(( $(date +%s) + 120 ))
while true
do
  res=$(curl -k -m 5 -s "$public_url" || true)
  if [[ -z "$res" || "$res" == *"Waiting for proxy to wake up"* ]]
  then
    if [[ "$(date +%s)" -gt "$timeout" ]]
    then echo "Timed out waiting for $public_url to respond.." && exit
    else sleep 2
    fi
  else echo "Good Morning!"; break;
  fi
done

# Delete old images in prod to prevent the disk from filling up
if [[ "$DEGENFOLIO_PROD" == "true" ]]
then
  docker container prune --force;
  echo "Removing ${project} images that aren't tagged as $commit or $semver or latest"

  mapfile -t imagesToKeep < <(docker image ls \
    | grep "${project}_" \
    | awk '{ print $3"-"$2}' \
    | sort \
    | grep -E "(latest|$commit|$semver)" \
    | cut -d "-" -f 1 \
    | sort -u \
  )

  for image in $(docker image ls -q | sort -u)
  do
    if ! grep -qs "$image" <<<"${imagesToKeep[*]}"
    then
      # It's hard to detect images w dependents, just rm them & fail gracefully if not possible
      docker image rm --force "$image" || true
    fi
  done
fi
