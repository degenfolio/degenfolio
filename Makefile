########################################
# Setup Env

# Specify make-specific variables (VPATH = prerequisite search path)
VPATH=.flags
SHELL=/bin/bash

root=$(shell cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )
project=$(shell cat $(root)/package.json | jq .name | tr -d '"')
find_options=-type f -not -path "**/node_modules/**" -not -path "**/.*" -not -path "**/dist/**"

cwd=$(shell pwd)
commit=$(shell git rev-parse HEAD | head -c 8)
semver=v$(shell cat package.json | grep '"version":' | awk -F '"' '{print $$4}')

# Setup docker run time
# If on Linux, give the container our uid & gid so we know what to reset permissions to
# On Mac, the docker-VM takes care of this for us so pass root's id (ie noop)
my_id=$(shell id -u):$(shell id -g)
id=$(shell if [[ "`uname`" == "Darwin" ]]; then echo 0:0; else echo $(my_id); fi)
interactive=$(shell if [[ -t 0 && -t 2 ]]; then echo "--interactive"; else echo ""; fi)
docker_run=docker run --name=$(project)_builder $(interactive) --tty --rm --volume=$(cwd):/root $(project)_builder $(id)

# Pool of images to pull cached layers from during docker build steps
image_cache=$(shell if [[ "${CI_SERVER}" == "yes" ]]; then echo "--cache-from=$(project)_builder:latest,$(project)_proxy:latest,$(project)_webserver:latest"; else echo ""; fi)

# Helper functions
startTime=.flags/.startTime
totalTime=.flags/.totalTime
log_start=@echo "=============";echo "[Makefile] => Start building $@"; date "+%s" > $(startTime)
log_finish=@echo $$((`date "+%s"` - `cat $(startTime)`)) > $(totalTime); rm $(startTime); echo "[Makefile] => Finished building $@ in `cat $(totalTime)` seconds";echo "=============";echo

# Create output folders
$(shell mkdir -p .flags)

########################################
# Command & Control Aliases

default: adapters
dev: proxy node-modules
prod: dev webserver
all: prod

start: dev
	bash ops/start.sh

start-prod:
	DEGENFOLIO_PROD=true bash ops/start.sh

stop:
	bash ops/stop.sh

restart: dev stop
	bash ops/start.sh

restart-prod: stop
	DEGENFOLIO_PROD=true bash ops/start.sh

clean: stop
	rm -rf build
	rm -rf .flags/*
	docker container prune -f

reset-images:
	rm .flags/proxy .flags/webserver

purge: clean

push: push-commit
push-commit:
	bash ops/push-images.sh $(commit)
push-semver:
	bash ops/pull-images.sh $(commit)
	bash ops/tag-images.sh $(semver)
	bash ops/push-images.sh $(semver)

pull: pull-latest
pull-latest:
	bash ops/pull-images.sh latest
pull-commit:
	bash ops/pull-images.sh $(commit)
pull-semver:
	bash ops/pull-images.sh $(semver)

dls:
	@docker service ls && echo '=====' && docker container ls -a

########################################
# Real Build Rules

builder: $(shell find ops/builder $(find_options))
	$(log_start)
	docker build --file ops/builder/Dockerfile $(image_cache) --tag $(project)_builder:latest ops/builder
	docker tag $(project)_builder:latest $(project)_builder:$(commit)
	$(log_finish) && mv -f $(totalTime) .flags/$@

node-modules: builder $(shell find modules/*/package.json $(find_options))
	$(log_start)
	$(docker_run) "lerna bootstrap --hoist"
	$(log_finish) && mv -f $(totalTime) .flags/$@

########################################
# Typescript -> Javascript

adapters: node-modules $(shell find modules/adapters/src $(find_options))
	$(log_start)
	$(docker_run) "cd modules/adapters && npm run build"
	$(log_finish) && mv -f $(totalTime) .flags/$@

client-bundle: adapters $(shell find modules/client/src $(find_options))
	$(log_start)
	$(docker_run) "cd modules/client && npm run build"
	$(log_finish) && mv -f $(totalTime) .flags/$@

server-bundle: adapters $(shell find modules/server/src $(find_options))
	$(log_start)
	$(docker_run) "cd modules/server && npm run build"
	$(log_finish) && mv -f $(totalTime) .flags/$@

########################################
# Docker Images

webserver: client-bundle $(shell find modules/client/ops $(find_options))
	$(log_start)
	docker build --file modules/client/ops/Dockerfile $(cache_from) --tag $(project)_webserver:latest modules/client
	docker tag $(project)_webserver:latest $(project)_webserver:$(commit)
	$(log_finish) && mv -f $(totalTime) .flags/$@

server: server-bundle $(shell find modules/server/ops $(find_options))
	$(log_start)
	docker build --file modules/server/ops/Dockerfile $(image_cache) --tag $(project) modules/server
	docker tag $(project) $(project):$(commit)
	$(log_finish) && mv -f $(totalTime) .flags/$@

proxy: $(shell find ops/proxy $(find_options))
	$(log_start)
	docker build --file ops/proxy/Dockerfile $(image_cache) --tag $(project)_proxy ops/proxy
	docker tag $(project)_proxy $(project)_proxy:$(commit)
	$(log_finish) && mv -f $(totalTime) .flags/$@
