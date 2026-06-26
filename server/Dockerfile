# syntax=docker/dockerfile:1

# ---- Build stage ------------------------------------------------------------
# Pinned to match the toolchain the project is developed with (rustc 1.96).
FROM rust:1.96-slim-bookworm AS builder

WORKDIR /app

# Pre-cache dependencies: copy only the manifests, build a throwaway main, then
# build again with the real sources. This keeps the dependency layer cached
# whenever only application code changes.
COPY Cargo.toml Cargo.lock ./
RUN mkdir src \
    && echo 'fn main() {}' > src/main.rs \
    && cargo build --release \
    && rm -rf src

# Now build the actual binary.
COPY src ./src
# Touch so cargo notices the real sources are newer than the dummy build.
RUN touch src/main.rs \
    && cargo build --release \
    && strip target/release/server

# ---- Runtime stage ----------------------------------------------------------
# Distroless gives a tiny image with just glibc + CA certs (sqlx uses rustls,
# so no OpenSSL is required).
FROM gcr.io/distroless/cc-debian12 AS runtime

WORKDIR /app

COPY --from=builder /app/target/release/server /usr/local/bin/server

# Matches the default in main.rs; override with -e PORT=...
ENV PORT=4000
EXPOSE 4000

# Distroless runs as non-root (uid 65532) by default.
USER nonroot

ENTRYPOINT ["/usr/local/bin/server"]
