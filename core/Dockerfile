FROM python:3.7-alpine as base

FROM base as builder
RUN apk add --update --no-cache \
    gcc \
    linux-headers \
    make \
    musl-dev \
    python-dev \
    g++

COPY Pipfile .
COPY Pipfile.lock .

RUN python3 -m pip install --upgrade pip
RUN pip install pipenv
RUN pipenv install --system --deploy --ignore-pipfile

FROM builder

WORKDIR /app/
ADD . .