FROM golang:1.13-alpine AS builder

COPY . /go/src/goproxy
WORKDIR /go/src/goproxy/

RUN GOOS=linux GOARCH=amd64 go build -o ./goproxy ./main.go

FROM builder

COPY --from=builder /go/src/goproxy .

ENTRYPOINT ["./goproxy"]