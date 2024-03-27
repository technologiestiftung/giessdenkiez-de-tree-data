FROM python:3.9
RUN apt-get update && apt-get install -y \
	build-essential \
	libpq-dev \
	libgeos-dev \
	libproj-dev \
	python3-dev \
	gdal-bin \
	libgdal-dev \
	gcc \
	tmux \
	vim \
	magic-wormhole \
	&& rm -rf /var/lib/apt/lists/*
RUN pip install --upgrade pip setuptools wheel
WORKDIR /usr/app
# PROJECT_ROOT is used by the python scripts
ENV PROJECT_ROOT /usr/app
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
COPY ./requirements.txt requirements.txt
RUN pip install -v -r requirements.txt
COPY . .
CMD ["tail", "-f", "/dev/null"]
