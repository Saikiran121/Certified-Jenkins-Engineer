# Demo: Build and Test via Jenkins Pipeline

This demo walks you through automating a real Java/Maven lifecycle. We will compile the code, run unit tests, and save the resulting JAR file as an artifact.

---

## 1. The Application Overview

We are using the **`Simple-Maven-Application`** project. It has:
- A `pom.xml` defining a JUnit dependency.
- `App.java`: A main class with a `getMessage()` method.
- `AppTest.java`: A test class that verifies the message is correct.

---

## 2. Creating the Pipeline Job

### Step 1: Create the Project
1.  On Jenkins Dashboard, click **New Item**.
2.  Name: `03-Maven-Build-and-Test`.
3.  Select **Pipeline** and click **OK**.

### Step 2: Write the Jenkinsfile
Copy and paste the following code into the Pipeline definition script:

```groovy
pipeline {
    agent any

    tools {
        // Must match the name in Manage Jenkins -> Tools
        maven 'M3912'
    }

    stages {
        stage('Checkout') {
            steps {
                echo "Cloning the repository..."
                // Manual Git Checkout (Required if Jenkinsfile is NOT in SCM yet)
                git url: 'https://github.com/Saikiran121/Certified-Jenkins-Engineer.git',
                    branch: 'main'
            }
        }

        stage('Build') {
            steps {
                echo "Compiling the code..."
                // Move into the specific sub-folder if necessary
                dir('Simple-Maven-Application') {
                    sh 'mvn clean install -DskipTests'
                }
            }
        }

        stage('Unit Tests') {
            steps {
                echo "Running JUnit Tests..."
                dir('Simple-Maven-Application') {
                    sh 'mvn test'
                }
            }
            post {
                always {
                    junit '**/target/surefire-reports/*.xml'
                }
            }
        }
// ... rest of stages ...
```

        stage('Archive Artifacts') {
            steps {
                echo "Saving the JAR file for future use..."
                archiveArtifacts artifacts: '**/target/*.jar', fingerprint: true
            }
        }
    }

    post {
        always {
            echo "Pipeline finished. Cleaning up workspace..."
            deleteDir() // Deletes the workspace to save disk space
        }
        success {
            echo "Build and Test successful! Artifact archived."
        }
        failure {
            echo "Build failed. Check the JUnit reports."
        }
    }
}
```

---

## 3. Key Concepts Explained

### A. The `tools` Directive
By defining `maven 'M3912'`, Jenkins automatically adds Maven to the `$PATH`. You don't need to specify absolute paths like `/usr/bin/mvn`.

### B. The `junit` Step
Running tests is only half the job. The `junit` step reads XML reports and creates interactive graphs in the Jenkins UI, allowing you to see exactly which test failed and why.

### C. `archiveArtifacts`
While `stash` is for temporary files during build, `archiveArtifacts` is for **permanent storage**. The resulting `.jar` file will be pinned to this build record forever (or until your build discarder deletes it).

### D. Workspace Hygiene
In the `post { always }` block, we use `deleteDir()`. In production, leaving massive build folders on disk after every run will eventually crash your Jenkins server. Always clean up!

---

## 4. Verification
1.  Click **Build Now**.
2.  Once finished, click on the build number.
3.  You will see:
    -   **Test Result**: Showing `1 test passed`.
    -   **Build Artifacts**: A downloadable link to your `simple-maven-app-1.0-SNAPSHOT.jar`.
