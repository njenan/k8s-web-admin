SHELL = /bin/bash

SHA := $(shell git rev-parse --short HEAD)

dockerize:
	docker build . --tag njenan/k8s-web-admin:$(SHA)
	docker push njenan/k8s-web-admin:$(SHA)

