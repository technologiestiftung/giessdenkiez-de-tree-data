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
# In Makefiles, `.PHONY: build run clean` indicates that `build`, `run`, and `clean` are phony targets. Phony targets are not associated with files; they serve as a way to name a recipe to be executed when explicitly requested. Defining these as phony ensures that make will run them unconditionally, even if there are existing files or directories with those names. This is useful for organizing and executing build scripts, running your project, and cleaning up generated files, respectively, without make mistaking them for actual files or directories to be checked for changes.
.PHONY: build run clean
