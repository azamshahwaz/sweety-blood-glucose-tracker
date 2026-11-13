FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY migrations ./migrations
COPY seeds ./seeds
COPY src ./src
EXPOSE 5000
CMD ["sh", "-c", "npm run migrate && npm start"]
