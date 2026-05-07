FROM rust:1.80 as builder

WORKDIR /usr/src/app
COPY . .

# Build the main server binary
RUN cargo build --release --bin arbitrage_bot

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/src/app/target/release/arbitrage_bot /usr/local/bin/arbitrage_bot

ENTRYPOINT ["arbitrage_bot"]
