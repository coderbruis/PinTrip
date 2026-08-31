FROM maven:3.9.11-eclipse-temurin-17 AS build

WORKDIR /workspace
COPY services/admin-api/pom.xml services/admin-api/pom.xml
COPY services/admin-api/src services/admin-api/src
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B \
      -Dmaven.wagon.http.retryHandler.count=5 \
      -Dmaven.wagon.httpconnectionManager.ttlSeconds=30 \
      -Daether.connector.http.retryHandler.count=5 \
      -f services/admin-api/pom.xml package -DskipTests

FROM eclipse-temurin:17-jre

WORKDIR /app
COPY --from=build /workspace/services/admin-api/target/pintrip-admin-api-*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
