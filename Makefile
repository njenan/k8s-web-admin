SHELL = /bin/bash

REGISTRY := "192.168.0.202:5000"
SHA := $(shell git rev-parse --short HEAD)

dockerize:
	docker build . -f Dockerfile --tag $(REGISTRY)/njenan/k8s-web-admin:$(SHA)
	docker push $(REGISTRY)/njenan/k8s-web-admin:$(SHA)

