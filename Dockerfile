# stage 1
FROM node:19-bullseye-slim as www

WORKDIR /build
COPY ./www .
RUN npm run build

# stage 2
FROM gradle:jdk17 as build

WORKDIR /build
COPY . .
RUN gradle --no-daemon :buildFatJar

# stage 3
FROM gcr.io/distroless/java17-debian11

WORKDIR /app
ENV WWW="/www"
ENV TURN_KEY="replace_me"

COPY --from=www /build/build/ /www
COPY --from=build /build/build/libs/wkwebrtc.jar /app/wkwebrtc.jar
CMD ["/app/wkwebrtc.jar"]
