# Start from Node 8 image
FROM node:8

# I broke it
MAINTAINER Eddie Reeder

# Create working directory
WORKDIR /usr/src/alleys/alleys-mapping

# Copy over files
COPY . .

# Expose port to other containers
EXPOSE 5002

# Run server
CMD node server.js