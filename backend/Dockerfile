# ==============================================================================
# CarbonFlow Enterprise Backend - Multi-Stage Production Dockerfile
# Runtime: Java 21 (Eclipse Temurin JRE)
# Build Tool: Maven 3.9
# Target Platform: Render Web Service (Docker Runtime)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build stage with full JDK 21 and Maven
# ------------------------------------------------------------------------------
FROM maven:3.9.9-eclipse-temurin-21-jammy AS builder

WORKDIR /build

# 1. Copy pom.xml first to take advantage of Docker layer caching for dependencies
COPY pom.xml .

# Download dependencies offline to optimize rebuilds
RUN mvn dependency:go-offline -B

# 2. Copy source code and build the production executable Spring Boot JAR
COPY src ./src
RUN mvn clean package -DskipTests -B

# ------------------------------------------------------------------------------
# Stage 2: Minimal, secure runtime stage with Eclipse Temurin JRE 21
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-jammy AS runner

# Create a non-privileged dedicated system user and group
RUN groupadd -g 10001 spring && \
    useradd -u 10001 -g spring -s /bin/false -m spring

WORKDIR /app

# Create data directory with proper ownership for temporary/embedded storage fallback
RUN mkdir -p /app/data && chown -R spring:spring /app

# Copy only the compiled Spring Boot executable JAR from builder stage
COPY --from=builder --chown=spring:spring /build/target/carbonflow-backend-*.jar /app/app.jar

# Switch to the non-root user
USER spring:spring

# Expose container port (Default 8080; Render assigns dynamic PORT at runtime)
EXPOSE 8080

# Environment defaults
ENV PORT=8080 \
    JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC -Djava.security.egd=file:/dev/./urandom"

# Healthcheck configuration pointing to CarbonFlow's actuator / health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8080}/actuator/health || exit 1

# Start Spring Boot application using exec to ensure proper SIGTERM handling
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -Dserver.port=${PORT:-8080} -jar /app/app.jar"]
