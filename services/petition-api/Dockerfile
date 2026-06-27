# Stage 1: Build the Rust binary
FROM rust:1.94-slim AS builder

WORKDIR /app

# Install compilation dependencies (pkg-config, libssl-dev, etc.)
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy cargo files
COPY Cargo.toml ./

# Create dummy source file to pre-build dependencies and cache them
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -f target/release/deps/petition_api*

# Copy actual source code and migrations
COPY src ./src
COPY migrations ./migrations

# Build production binary
RUN cargo build --release

# Stage 2: Final runtime container
FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies (OpenSSL & CA certificates for outbound HTTPS calls)
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Copy binary from builder
COPY --from=builder /app/target/release/petition-api /app/petition-api
COPY --from=builder /app/migrations /app/migrations

# Expose Axum API port
EXPOSE 3000

ENV RUST_LOG=info

# Run application
CMD ["/app/petition-api"]
