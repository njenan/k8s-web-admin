SHELL = /bin/bash

SHA := $(shell git rev-parse --short HEAD)

dockerize:
	docker build . -f Dockerfile --tag njenan/k8s-web-admin:$(SHA)
	docker build . -f DockerfileArm --tag njenan/arm-k8s-web-admin:$(SHA)
	docker push njenan/k8s-web-admin:$(SHA)

