FROM node:20-slim
WORKDIR /app

# Install chromium dependencies for Playwright
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    wget \
    && rm -rf /var/lib/apt/lists/*

ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium

COPY package*.json ./
RUN npm ci --production
COPY src/ ./src/
COPY .env.example ./.env.example
# Prompt files are mounted via docker-compose volumes
VOLUME /app/data
EXPOSE 3000
CMD ["node", "src/index.js"]
