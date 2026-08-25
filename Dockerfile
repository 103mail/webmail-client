# One bundle serves every Domain. Nothing domain-specific is baked in: the
# client reads /config.json at boot and takes its domain, API base and branding
# from there, so this image is identical for 103mail.com and example.com.
FROM node:24-alpine AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json vite.config.ts index.html ./
COPY public/ public/
COPY src/ src/
RUN npm run build

FROM nginx:1.27-alpine
# The site config is mounted at /etc/nginx/templates/ by compose and rendered
# with ${WEBMAIL_DOMAIN} at start-up. The stock default would otherwise answer
# for any hostname that does not match it.
RUN rm -f /etc/nginx/conf.d/default.conf
COPY --from=build /src/dist /usr/share/nginx/html
EXPOSE 80 443
