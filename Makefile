# Everyday commands. Plain npm underneath, so nothing here is required.
#
#   make           type-check and build the bundle into dist/
#   make dev       Vite dev server on http://localhost:5173 against a bare
#                  server (API_BASE, DOMAIN); the full stack in
#                  ../webmail-deploy runs its own (docker-compose.dev.yml)
#   make check     type-check only, the gate before a commit
#
# Every target installs node_modules first when package-lock.json is newer.

API_BASE ?= http://localhost:8080/api/v1
DOMAIN ?= 103mail.com

.PHONY: build dev check preview clean

build: node_modules
	npm run build

dev: node_modules
	VITE_API_BASE=$(API_BASE) VITE_DOMAIN=$(DOMAIN) npm run dev

check: node_modules
	npx tsc

preview: build
	npm run preview

clean:
	rm -rf dist

node_modules: package-lock.json
	npm ci
	@touch $@
