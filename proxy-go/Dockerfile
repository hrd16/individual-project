FROM golang:1.13-alpine AS builder

COPY . /go/src/proxy-go
WORKDIR /go/src/proxy-go/

RUN GOOS=linux GOARCH=amd64 go build -o ./proxy-go ./main.go

FROM builder

COPY --from=builder /go/src/proxy-go .

ENTRYPOINT ["./proxy-go"]