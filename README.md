# Microservice Assignment

<p>
This project provides the backend to a fictional ride-service platform called 'Alleys'. It contains multiple NodeJS microservices
which are then encapsulated in their own Docker containers.
</p>

## Getting Started

### Prerequisites

<p>
You are required to have Docker installed. Please keep in mind that if this were not an assignment Docker Compose would be
used to manage the separate services instead of single Docker commands, however this was not required in the specification.
</p>

### Building

<p>
At the project root, build the Docker images with:
</p>

```
docker build -t authenticationimage alleys-authentication/
docker build -t mappingimage alleys-mapping/
docker build -t rosterimage alleys-roster/
docker build -t bestdriverimage alleys-best-driver/
```

### Running

<p>
Create a new Docker network for the containers to communicate through with:
</p>

```
docker network create --subnet 192.168.1.0/24 alleysnet
```

<p>
Run the Docker images in their containers with:
</p>

```
docker run --name alleys-db --net alleysnet -d mongo
docker run --name alleys-authentication --net alleysnet -p 5001:5001 -d authimage
docker run --name alleys-mapping --net alleysnet -d mappingimage
docker run --name alleys-roster --net alleysnet -p 5003:5003 -d rosterimage
docker run --name alleys-best-driver --net alleysnet -p 5004:5004 -d bestdriverimage
```
