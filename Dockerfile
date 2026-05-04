# Use the official Rust image as a builder
FROM rust:1.80-slim-bullseye AS builder
WORKDIR /app
COPY . .
RUN cargo build --release --bin arbitrage-bot

# Use a minimal image for the runtime
FROM debian:bullseye-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/target/release/arbitrage-bot /usr/local/bin/
COPY .env.example .env
EXPOSE 8000
CMD ["arbitrage-bot"]
