FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
	build-essential \
	libpq-dev \
	libgeos-dev \
	libproj-dev \
	python3-dev \
	python3-venv \
	python3-full \
	gdal-bin \
	ripgrep \
	libgdal-dev \
	gcc \
	postgresql-client \
	postgresql-server-dev-all \
	tmux \
	jq \
	vim \
	magic-wormhole \
	curl \
	&& rm -rf /var/lib/apt/lists/*

# Install Node.js v23.9.0
RUN curl -fsSL https://deb.nodesource.com/setup_23.x | bash - \
    && apt-get update \
    && apt-get install -y nodejs \
    && npm install -g npm@latest \
    && node -v \
    && npm -v

# Set up Python virtual environment
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

RUN pip install --upgrade pip setuptools wheel
WORKDIR /usr/app
# PROJECT_ROOT is used by the python scripts
ENV PROJECT_ROOT=/usr/app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
# COPY ./requirements.txt requirements.txt
# RUN pip install -v -r requirements.txt
COPY . .
CMD ["sleep", "infinity"]
