# Multi-stage build for Atomic Mail Clone (static React SPA)
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@11.5.2 --activate

# Install deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/
COPY packages/crypto/package.json ./packages/crypto/
COPY packages/shared-types/package.json ./packages/shared-types/

RUN pnpm install --frozen-lockfile --ignore-scripts

# Build
COPY apps/web/ ./apps/web/
COPY packages/ ./packages/
RUN pnpm --filter web build

# Runtime — minimal nginx for static files
FROM nginx:1.27-alpine

# Copy built files + fix permissions
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
RUN chmod -R a+rX /usr/share/nginx/html

# Custom nginx config for SPA routing (fallback to index.html for /app/* routes)
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  # Include the default MIME types (js, css, html, etc.) and add markdown
  include /etc/nginx/mime.types;
  default_type application/octet-stream;
  types {
    text/markdown md markdown;
  }

  # Cache static assets aggressively
  location ~* \.(js|css|png|jpg|jpeg|gif|svg|woff2?|ico|webp)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
  }

  # SPA fallback — anything not a file → index.html
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Gzip
  gzip on;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml text/markdown;
  gzip_min_length 256;

  # Security headers
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
EOF

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
