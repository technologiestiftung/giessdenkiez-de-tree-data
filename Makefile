# Define variables for docker commands
IMAGE_NAME=technologiestiftung/giessdenkiez-de-tree-data
CONTAINER_NAME=gdk-python-runner


# Build docker image
build:
	docker build --tag $(IMAGE_NAME) .

# Run docker container
run:
	docker run --name ${CONTAINER_NAME} --detach \
		--env-file $(shell pwd)/tree_data/.env \
		--volume "$(shell pwd)/tree_data:/usr/app/tree_data" \
		${IMAGE_NAME}


# Start an interactive session in the container
shell:
	docker exec --interactive --tty $(CONTAINER_NAME) /bin/bash


# Use this command to stop and remove the running container
clean:
	docker stop $(CONTAINER_NAME)
	docker rm $(CONTAINER_NAME)

.PHONY: build run clean
