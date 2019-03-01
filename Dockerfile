# Step 1 build static website

FROM node:alpine as builder
RUN apk update \ 
    && apk add --no-cache make git \
    && npm install -g @angular/cli@7.1.4

# Create app directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json /app/
RUN cd /app && npm set progress=false && npm install

# Copy project files into the docker image
COPY . /app

# Build angular application
RUN cd /app && ng build --prod

# Step 2 build a small nginx image with static website

FROM nginx:alpine

## Remove default nginx website

RUN rm -rf /usr/share/nginx/html/*

## From 'builder' copy website to default nginx public folder

COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
