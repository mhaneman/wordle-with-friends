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

FROM gcr.io/distroless/static-debian12 AS prod
WORKDIR /
COPY --from=build /server /server
COPY --from=build /app/migrations /migrations
COPY --from=build /app/data /data
EXPOSE 8080
ENTRYPOINT ["/server"]
