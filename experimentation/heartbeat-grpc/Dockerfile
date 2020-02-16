FROM python:3.7-alpine

RUN apk add --update --no-cache \
    gcc \
    linux-headers \
    make \
    musl-dev \
    python-dev \
    g++

ADD . /

RUN python -m pip install --upgrade pip

RUN pip install pipenv

RUN pipenv install --deploy --ignore-pipfile