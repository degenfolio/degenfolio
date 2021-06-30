#!/bin/bash

url="https://api.thegraph.com/subgraphs/name/aave/protocol-v2"
data=$(echo '{"query": "{
  pools {
    id
  }
}"}' | tr -d '\n\r') 

curl -qs -X POST --data "$data" "$url" | jq

