FROM node:12.2.0-alpine AS builder

WORKDIR /app
COPY client .
RUN npm install react-scripts -g --silent
RUN npm run build

FROM node:12.2.0-alpine
WORKDIR /app
COPY --from=builder /app/build client/build
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD [ "node", "app.js" ]