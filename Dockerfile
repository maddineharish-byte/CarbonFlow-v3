# ==============================================================================
# CarbonFlow Enterprise Backend - Multi-Stage Production Dockerfile (Root Context)
# Runtime: Java 21 (Eclipse Temurin JRE)
# Build Tool: Maven 3.9
# Target Platform: Render Web Service (Root Repository Context)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build stage with full JDK 21 and Maven
# ------------------------------------------------------------------------------
FROM maven:3.9.9-eclipse-temurin-21-jammy AS builder

WORKDIR /build

# Copy pom.xml first to optimize layer caching for dependencies
COPY backend/pom.xml .

# Download dependencies offline to optimize rebuilds
RUN mvn dependency:go-offline -B

# Copy backend source code and package executable Spring Boot JAR
COPY backend/src ./src
RUN mvn clean package -DskipTests -B

# ------------------------------------------------------------------------------
# Stage 2: Minimal, secure runtime stage with Eclipse Temurin JRE 21
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-jammy AS runner

# Create non-root dedicated system user and group
RUN groupadd -g 10001 spring && \
    useradd -u 10001 -g spring -s /bin/false -m spring

WORKDIR /app

# Create storage directory for fallback data with proper permissions
RUN mkdir -p /app/data && chown -R spring:spring /app

# Copy the packaged Spring Boot executable JAR
COPY --from=builder --chown=spring:spring /build/target/carbonflow-backend-*.jar /app/app.jar

# Switch to the non-root user
USER spring:spring

# Expose default port
EXPOSE 8080

# Environment defaults
ENV PORT=8080 \
    JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC -Djava.security.egd=file:/dev/./urandom"

# Health check endpoint configured for Spring Boot Actuator
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8080}/actuator/health || exit 1

# Start Spring Boot application honoring Render's dynamic PORT
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -Dserver.port=${PORT:-8080} -jar /app/app.jar"]
