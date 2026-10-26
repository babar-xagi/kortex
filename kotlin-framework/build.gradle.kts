plugins {
    kotlin("jvm") version "2.1.0"
    kotlin("plugin.serialization") version "2.1.0"
    application
}

group = "io.kortex"
version = "1.0.0"

repositories {
    mavenCentral()
}

dependencies {
    // High-Performance Non-Blocking Coroutines & Serialization
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.9.0")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")

    // Non-Blocking R2DBC PostgreSQL & Connection Pooling
    implementation("io.r2dbc:r2dbc-postgresql:0.8.13.RELEASE")
    implementation("io.r2dbc:r2dbc-pool:1.0.1.RELEASE")

    // Cryptography & JWT Security
    implementation("de.mkammerer:argon2-jvm:2.11")
    implementation("com.auth0:java-jwt:4.4.0")
}

kotlin {
    jvmToolchain(21)
}

application {
    mainClass.set("io.kortex.sample.ApplicationKt")
}
