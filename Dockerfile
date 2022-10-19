FROM gradle:jdk17 as build

WORKDIR /build
COPY . .
RUN gradle --no-daemon :buildFatJar

FROM gcr.io/distroless/java17-debian11

WORKDIR /app
COPY --from=build /build/build/libs/wkwebrtc.jar /app/wkwebrtc.jar
CMD ["/app/wkwebrtc.jar"]
