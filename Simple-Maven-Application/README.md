# Simple Maven Application

A lightweight Java/Maven project designed for demonstrating Jenkins Pipeline-as-Code capabilities. This project includes unit tests and standard Maven lifecycle configurations.

---

## 📋 Prerequisites

To work with this project locally, ensure you have the following installed:
- **Java JDK**: 11 or higher (Tested with OpenJDK 21)
- **Apache Maven**: 3.6+ 

---

## 🛠️ Local Development Workflow

### 1. How to Build the Project (Create JAR)
To compile the source code and package it into a JAR file, run:
```bash
mvn clean package
```
- **The Result**: The final JAR file will be located in the `target/` directory: `target/simple-maven-app-1.0-SNAPSHOT.jar`.

### 2. How to Run Unit Tests
To execute the JUnit 4 test cases and verify code logic:
```bash
mvn test
```
- **The Result**: Summary of tests will be shown in the console. Detailed XML reports are generated in `target/surefire-reports/`.

### 3. How to Run the Application
Once the JAR is built, you can run the application directly using the Java runtime:
```bash
java -cp target/simple-maven-app-1.0-SNAPSHOT.jar com.mycompany.app.App
```
*(Note: Since this is a simple utility app, it will output "Hello World" and exit.)*

---

## 🧪 Advanced: Integration Testing

In industrial software engineering, we distinguish between **Unit Tests** (fast) and **Integration Tests** (slower, involving external systems).

### The "Failsafe" Pattern
For local integration testing in Maven:
1.  Name your integration tests with the suffix `IT.java` (e.g., `DatabaseIT.java`).
2.  Run the following command:
```bash
mvn verify
```
- **Why `verify`?**: The `verify` command runs the full lifecycle, including `package`, and then executes integration tests using the **Maven Failsafe Plugin**.

---

## 🚀 Jenkins Integration

This project is pre-configured with a **`Jenkinsfile`** in the root directory. To automate this build:
1. Create a Jenkins Pipeline job.
2. Select **Pipeline script from SCM**.
3. Point to this repository.
4. Jenkins will automatically follow the instructions to Build, Test, and Archive this application.
