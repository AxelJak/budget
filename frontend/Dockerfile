FROM node:20-alpine as build

WORKDIR /app

# Installera dependencies
COPY package.json ./
RUN npm install

# Kopiera source och bygg
COPY . .
RUN npm run build

# Production stage med nginx
FROM nginx:alpine

# Kopiera built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Kopiera nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
