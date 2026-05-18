FROM golang:1.23-bookworm AS dev
WORKDIR /app
# Pin goose: @latest currently requires Go 1.25+ (see pressly/goose v3.27+)
RUN go install github.com/pressly/goose/v3/cmd/goose@v3.24.1
COPY go.mod go.sum* ./
RUN go mod download 2>/dev/null || true
COPY . .
EXPOSE 8080
CMD ["sh", "-c", "go mod tidy && goose -dir migrations postgres \"$DATABASE_URL\" up && go run ./cmd/server"]

FROM golang:1.23-bookworm AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /server ./cmd/server

FROM golang:1.23-bookworm AS goose-bin
# Static binary so goose runs on the Alpine prod image (glibc goose → "not found" on musl).
RUN CGO_ENABLED=0 go install github.com/pressly/goose/v3/cmd/goose@v3.24.1

FROM alpine:3.20 AS prod
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=build /server /app/server
COPY --from=build /app/migrations /app/migrations
COPY --from=build /app/data /app/data
COPY --from=goose-bin /go/bin/goose /usr/local/bin/goose
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh
ENV DATA_DIR=/app/data
EXPOSE 8080
ENTRYPOINT ["/app/docker-entrypoint.sh"]
