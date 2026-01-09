FROM nginx:alpine

# Remove default nginx files
RUN rm -rf /usr/share/nginx/html/*

# Copy your src files into nginx html folder
COPY ./src/ /usr/share/nginx/html/

EXPOSE 80