FROM node:12.16.0-alpine AS builder

WORKDIR /app
COPY client .
RUN npm install react-scripts -g --silent
RUN npm install
RUN npm run build

FROM node:12.16.0-alpine
WORKDIR /app
COPY --from=builder /app/build ../client/build
COPY server/package*.json ./
RUN npm install
COPY server .