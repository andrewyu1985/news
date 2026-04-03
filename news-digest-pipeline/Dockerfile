FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY src/ ./src/
COPY .env.example ./.env.example
# Prompt files are mounted via docker-compose volumes
VOLUME /app/data
EXPOSE 3000
CMD ["node", "src/index.js"]
