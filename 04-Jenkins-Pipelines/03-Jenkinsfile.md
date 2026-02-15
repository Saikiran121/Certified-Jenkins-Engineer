# The Jenkinsfile In-Depth: Mastering Pipeline-as-Code

The **Jenkinsfile** is the heart of modern automation. It is a text file that contains the entire definition of your Jenkins Pipeline. This guide breaks down every component of a standard Declarative Jenkinsfile.

---

## 1. The Core Structure (MANDATORY)

Every Declarative Pipeline must have these blocks to be valid:

-   **`pipeline { ... }`**: The wrapper that tells Jenkins "everything inside is a Pipeline."
-   **`agent`**: Defines **where** the build runs. 
    -   `agent any`: Use any available executor.
    -   `agent { label 'linux-node' }`: Run only on a specific tagged agent.
    -   `agent { docker { image 'maven:3-alpine' } }`: Run inside a specific container.
-   **`stages` & `stage`**: The logical segments of your process (e.g., `Build`, `Test`, `Deploy`).
-   **`steps`**: The actual terminal commands or plugins to execute (e.g., `sh`, `echo`, `junit`).

---

## 2. Global Directives (The POWER Tools)

These define technical behaviors across the entire pipeline:

### A. `options`
Configuration settings that affect the pipeline's behavior.
-   `buildDiscarder`: Auto-cleanup old builds to save disk space.
-   `timeout`: Terminate the build if it runs too long (e.g., `timeout(time: 1, unit: 'HOURS')`).
-   `timestamps`: Adds time to every line of the console log.

### B. `parameters`
Creates interactive inputs for the user.
-   **Example:** A `choice` parameter to decide which environment to deploy to (`Dev`, `QA`, `Prod`).

### C. `environment` (Deep Dive)
The `environment` directive allows you to define variables for the entire pipeline or a specific stage.

#### 1. Built-in Environment Variables
Jenkins provides a set of pre-defined variables that you can use anywhere:
- `env.BUILD_ID`: The current build ID (e.g., `123`).
- `env.JOB_NAME`: Name of this project (e.g., `Finance-App`).
- `env.BRANCH_NAME`: The Git branch being built (available in Multibranch/Org Folders).
- `env.JENKINS_URL`: The URL of your Jenkins server.
- `env.WORKSPACE`: The absolute path to the build directory.

**Usage Example:**
```groovy
steps {
    echo "This is Build #${env.BUILD_ID} for ${env.JOB_NAME}"
}
```

#### 2. Scope: Global vs. Stage Level
- **Global:** Defined at the top of the `pipeline` block; available everywhere.
- **Stage-Level:** Defined inside a `stage`; only available within those specific `steps`.

#### 3. Secure Credentials Binding
Never store passwords in plain text. Use the `credentials()` helper to bind secrets from Jenkins' secure store to environment variables.
```groovy
environment {
    // Jenkins masks these in logs with '****'
    AWS_ACCESS_KEY = credentials('aws-prod-key') 
    SONAR_TOKEN = credentials('sonar-api-token')
}
```

### D. `tools`
Auto-installs and configures build tools.
-   **Example:** `maven 'M3'` or `jdk 'Java17'`. Jenkins will ensure these versions are installed on the agent before execution.

### E. `triggers`
Defines how the pipeline should be started automatically.
-   `cron`: Scheduled builds (e.g., `triggers { cron('H H * * *') }` for nightly builds).
-   `pollSCM`: Check Git for changes.

---

## 3. The `post` Block: Executing Logic Based on Results (Deep Dive)

The `post` block runs after every build or specific stage. It acts as the "Decision Maker" for notifications and cleanup.

#### 1. Primary Conditions (The Most Used)
- **`always`**: Runs regardless of the build status. Essential for **Cleanup** tasks (e.g., `sh 'rm -rf tmp'`).
- **`success`**: Only runs if the build is "Blue" (Successful). Use this for **Notifications** and **Release** triggers.
- **`failure`**: Only runs if the build is "Red." Use this to alert developers or trigger **Rollbacks**.

#### 2. Advanced Conditions (The Audit Tools)
- **`unstable`**: Runs if tests failed but the code compiled (Yellow status).
- **`changed`**: Runs only if the current build's status is different from the previous one (e.g., Success -> Failure or Failure -> Success). Great for "Regression Alerts."
- **`aborted`**: Runs if a user manually stops the build.
- **`fixed`**: Runs if the previous build failed but this one succeeded.

#### 3. Industrial Scenario: Notification Logic
> **The Requirement:** "I want a Slack message every time, but only send a full Email with Logs to the DevOps team if the build fails."
>
> **The Pipeline Solution:**
```groovy
post {
    always {
        slackSend channel: '#deploy-feed', message: "Build ${env.BUILD_ID} finished."
    }
    failure {
        emailext body: "Critical failure in ${env.JOB_NAME}. Logs attached.", 
                 subject: "BUILD FAILED: ${env.JOB_NAME}",
                 attachLog: true
    }
}
```

---

## 4. Industrial "Production-Ready" Template

```groovy
pipeline {
    agent any 
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '15'))
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
    }
    
    environment {
        APP_NAME = "Finance-Backend"
        DB_CREDENTIALS = credentials('bank-db-token')
    }
    
    stages {
        stage('Initialize') {
            steps {
                echo "Starting build for ${env.APP_NAME}"
            }
        }
        stage('Build & Test') {
            parallel { // Run these two tasks at the same time!
                stage('JUnit Tests') { steps { sh 'mvn test' } }
                stage('Static Analysis') { steps { sh 'npm run lint' } }
            }
        }
        stage('Deploy') {
            when { branch 'main' } // Only deploy if we are on the main branch
            steps {
                echo "Deploying to Production using ${env.DB_CREDENTIALS}"
            }
        }
    }
    
    post {
        failure {
            emailext body: "Build Failed! Check logs.", subject: "ALERT: ${env.APP_NAME}"
        }
    }
}
```

---

## 5. Advanced Agents: Stage-Level Docker Containers

In a professional "Polyglot" pipeline, different parts of your build might require vastly different environments. For example, your Frontend needs **Node.js**, while your Backend needs **Java/Maven**.

### A. The "Agent None" Strategy
To use different containers for different stages, you must tell Jenkins NOT to pick a global agent at the start.
```groovy
pipeline {
    agent none // Do not pick a global executor
    stages {
        stage('Frontend') {
            agent { docker { image 'node:18-alpine' } }
            steps { sh 'npm install' }
        }
        stage('Backend') {
            agent { docker { image 'maven:3.9-eclipse-temurin-17' } }
            steps { sh 'mvn clean install' }
        }
    }
}
```

### B. Why Use Stage-Level Docker?
1.  **Isolation:** No "Dependency Hell." Stage A's Node.js version doesn't conflict with Stage B's Java version.
2.  **Ephemeral Environments:** The container is created when the stage starts and destroyed when it ends. This ensures a "Clean Room" build every time.
3.  **Workspace Sharing:** Jenkins automatically mounts your workspace (`/var/lib/jenkins/workspace/...`) into every container. Files created in the `node` stage are immediately available in the `maven` stage.

### C. Advanced Docker Configurations
Sometimes you need more than just an image name:

```groovy
stage('Secure Scan') {
    agent {
        docker {
            image 'my-private-registry.com/snyk-cli:latest'
            registryUrl 'https://my-private-registry.com'
            registryCredentialsId 'docker-hub-creds' // Secure login
            args '-v /tmp:/tmp --user root' // Custom Docker flags
        }
    }
    steps { sh 'snyk test' }
}
```

### D. Industrial Scenario: The Polyglot Workflow
> **The Context:** A FinTech company is building a "Payment Gateway."
> - **Stage 1 (Frontend):** Runs in a `node` container to compile React and run Jest tests.
> - **Stage 2 (Backend):** Runs in a `maven` container to build the Spring Boot API.
> - **Stage 3 (Security):** Runs in a `python:3.9` container to execute a custom compliance script.
>
> **The Result:** The DevOps team only needs one Jenkins Agent with Docker installed. They don't need to manually install Node, Java, and Python on the server hardware. Jenkins manages everything via containers.

---

## 6. The `script` Block: Escaping the Declarative Box

Declarative Pipelines are designed to be simple and structured. However, real-world requirements sometimes demand complex logic (loops, if/else, try/catch) that Declarative syntax doesn't support natively. This is where the **`script`** block comes in.

### A. What is it?
The `script` block allows you to write **Scripted Pipeline (Groovy)** code inside a Declarative `stage`. It gives you the full power of a programming language while keeping the overall structure of a Declarative Pipeline.

### B. Common Use Cases

#### 1. Conditional Logic (if/else)
While Declarative has a `when` directive, it only controls whether a stage runs. Inside a stage, you might need to make decisions:
```groovy
stage('Deploy') {
    steps {
        script {
            if (env.BRANCH_NAME == 'main') {
                echo "Deploying to Production..."
            } else {
                echo "Deploying to Staging..."
            }
        }
    }
}
```

#### 2. Iterative Tasks (Loops)
Useful for repetitive actions, like deploying to multiple servers or processing a list of files.
```groovy
stage('Multi-Node Setup') {
    steps {
        script {
            def nodes = ['web-01', 'web-02', 'web-03']
            for (int i = 0; i < nodes.size(); i++) {
                echo "Configuring node: ${nodes[i]}"
            }
        }
    }
}
```

#### 3. Exception Handling (try/catch)
Handle errors gracefully instead of letting the entire build crash instantly.
```groovy
stage('Security Scan') {
    steps {
        script {
            try {
                sh './run-fragile-scanner.sh'
            } catch (Exception e) {
                echo "Scanner failed, but continuing build with a warning: ${e.message}"
                currentBuild.result = 'UNSTABLE'
            }
        }
    }
}
```

### C. Industrial Scenario: Dynamic Multi-Region Rollout
> **The Context:** A global streaming service needs to deploy an update to three regions: `US`, `EU`, and `ASIA`.
>
> **The Problem:** They want to pause and ask for confirmation **before each region**, but they don't want to hardcode 3 separate stages.
>
> **The Script Solution:**
```groovy
stage('Regional Rollout') {
    steps {
        script {
            def regions = ['US-EAST', 'EU-WEST', 'AP-SOUTH']
            for (region in regions) {
                input message: "Deploy to ${region}?"
                echo "Rolling out to ${region}..."
                // Deployment logic here
            }
        }
    }
}
```

### D. Technical Precautions
- **Don't Overuse:** If your `script` block is longer than 50 lines, it's a sign that you should move that logic into a **Jenkins Shared Library** or a separate shell script.
- **Readability:** Mixing too much Groovy into a Declarative file makes it harder for non-developers to understand the build process.

---

## 7. The `when` Directive: Smart Stage Execution

The **`when`** directive allows you to skip a stage based on specific conditions. This makes your pipeline "smart" by only running expensive or sensitive tasks (like deployment or performance tests) when they are actually needed.

### A. Common Conditions

#### 1. `branch`
Execute a stage only for specific branches. Supports wildcards like `feature/*`.
```groovy
stage('Deploy to Prod') {
    when { branch 'main' } // Only runs if the current branch is 'main'
    steps { sh './deploy.sh' }
}
```

#### 2. `environment`
Execute based on a variable's value.
```groovy
stage('Debug Logs') {
    when { environment name: 'DEBUG_LEVEL', value: 'high' }
    steps { sh './collect-detailed-logs.sh' }
}
```

#### 3. `expression`
The most flexible way—using any Groovy logic that returns `true` or `false`.
```groovy
stage('Optional Test') {
    when { expression { return params.RUN_TESTS == true } }
    steps { echo "Running tests because user requested them..." }
}
```

#### 4. `changelog`
Only run if a specific file pattern changed in Git.
```groovy
stage('Audit Docs') {
    when { changelog '.*docs/.*' } // Only runs if files in /docs were changed
    steps { sh './generate-pdf.sh' }
}
```

### B. Logic Operators (Combining Conditions)

You can combine multiple conditions using logical operators:
- **`allOf`**: Runs only if ALL sub-conditions are true.
- **`anyOf`**: Runs if AT LEAST ONE sub-condition is true.
- **`not`**: Reverses the logic.

**Example: The Release Logic**
```groovy
stage('Publish Artifact') {
    when {
        allOf {
            branch 'release-*'
            expression { currentBuild.result == null } // Only if build is healthy
        }
    }
    steps { echo "Publishing release artifact..." }
}
```

### C. The `beforeAgent` Optimization
By default, Jenkins spins up an agent/container **before** checking the `when` condition. To save time and resources (especially with Docker), use `beforeAgent true`.
```groovy
stage('Heavy Simulation') {
    when {
        beforeAgent true
        expression { params.SKIP_SIM == false }
    }
    agent { label 'performance-node' }
    steps { sh './run-sim.sh' }
}
```
*Note: If `SKIP_SIM` is true, Jenkins won't even wake up the 'performance-node', saving cloud costs.*

### D. Industrial Scenario: The Pull-Request Workflow
> **The Context:** A software team uses Pull Requests (PRs). They want to run unit tests on every PR, but only run a full Deployment and Security Scan when the code is merged into `main`.
>
> **The Strategy:**
> 1. **Stage 1 (Test):** No `when` directive (runs always).
> 2. **Stage 2 (Scan/Deploy):** Use `when { branch 'main' }`.
>
> **The Result:** Faster feedback for developers on feature branches, while maintaining strict production gates.

---

## 8. Credentials Management: Security-First Automation

Handling sensitive data (passwords, API tokens, SSH keys) is the most critical part of a production pipeline. Jenkins provides a built-in **Credential Store** that encrypts these secrets and ensures they never appear in plain text in your build logs.

### A. The `credentials()` Helper (Declarative)
In a Declarative Pipeline, you use the `credentials()` helper inside the `environment` block. Jenkins automatically "masks" these variables in the console output with `****`.

#### 1. Secret Text (API Keys/Tokens)
```groovy
environment {
    API_TOKEN = credentials('my-slack-token')
}
steps {
    sh "curl -H 'Authorization: Bearer ${API_TOKEN}' https://api.slack.com/..."
}
```

#### 2. Username and Password
When you bind a "Username and Password" credential, Jenkins creates three variables for you:
- `${MY_CREDS}`: A combination of `username:password`.
- `${MY_CREDS_USR}`: The username only.
- `${MY_CREDS_PSW}`: The password only.

```groovy
environment {
    DB_LOGIN = credentials('postgres-admin')
}
steps {
    sh "psql -U ${DB_LOGIN_USR} -p ${DB_LOGIN_PSW} -h mydb.com"
}
```

#### 3. SSH Private Key
Used for authenticating with remote servers or private Git repositories via SSH.
```groovy
environment {
    SSH_KEY = credentials('webserver-private-key')
}
steps {
    sh "ssh -i ${SSH_KEY} user@webserver.com 'ls -l'"
}
```

#### 4. Secret File
Use this for config files that must remain encrypted, like `.kube/config` or GCloud service account JSONs.
```groovy
environment {
    KUBE_CONFIG = credentials('k8s-cluster-config')
}
steps {
    sh "kubectl --kubeconfig=${KUBE_CONFIG} get pods"
}
```

### B. Inline Secrets: `withCredentials` (Scripted)
Sometimes you only need a secret for a single command inside a `script` block. For this, use `withCredentials`.

```groovy
script {
    withCredentials([string(credentialsId: 'my-secret-id', variable: 'SECRET')]) {
        sh "myapp --token ${SECRET}"
    }
}
```

### C. Industrial Scenarios

#### Scenario A: Releasing to a Private Docker Registry
> **Process:** The pipeline builds a Docker image and needs to push it to a private Amazon ECR or Nexus registry.
> **The Solution:** Use a "Username and Password" credential to perform a secure login.
```groovy
environment {
    REG_CREDS = credentials('private-registry-login')
}
steps {
    sh "docker login -u ${REG_CREDS_USR} -p ${REG_CREDS_PSW} my-registry.com"
    sh "docker push my-registry.com/app:latest"
}
```

#### Scenario B: Multi-Cloud Authentication
> **Process:** A company uses both AWS and Azure. They have different keys for different stages.
> **The Solution:** Define stage-level credentials to ensure the Azure keys are never even loaded during the AWS build stage.

### D. Technical Best Practices
1.  **Never Use `echo`:** Never try to print a credential variable. Even though Jenkins masks them, it's a security risk.
2.  **ID Naming:** Use clear IDs in the Jenkins UI (e.g., `prod-db-password` instead of `creds1`).
3.  **Scoped Creds:** Store credentials in the "Folder" level rather than "Global" level if only one team needs them.

---

## 9. The `input` Directive: Manual Approval Gates

In an automated world, some decisions still require a human touch. The **`input`** directive pauses the pipeline and waits for a user to click "Approve" (Proceed) or "Abort." This is essential for **Production Deployments**, **Budget Approvals**, or **Manual QA Sign-offs**.

### A. Basic Syntax: The "Are You Sure?" Gate
```groovy
stage('Deploy to Prod') {
    input {
        message "Should we release this to Production?"
        ok "Yes, Release it!"
    }
    steps { sh './deploy-to-prod.sh' }
}
```

### B. Restricting Who Can Approve (`submitter`)
In a corporate environment, you don't want just anyone to be able to approve a production release. The `submitter` parameter restricts approval to specific users or groups.

```groovy
stage('Management Approval') {
    input {
        message "Approve budget for performance testing?"
        submitter "finance-team, admin-user" // Comma-separated LDAP users/groups
    }
    steps { echo "Budget approved. Starting tests..." }
}
```

### C. Gathering Data Mid-Build (`parameters`)
The `input` directive can also ask for data that wasn't known at the start of the build.

```groovy
stage('Custom Deployment') {
    input {
        message "Specify deployment details"
        parameters {
            choice(name: 'REGION', choices: ['US-East', 'EU-West'], description: 'Where to deploy?')
            booleanParam(name: 'CLEAR_CACHE', defaultValue: false, description: 'Wipe CDN cache?')
        }
    }
    steps {
        echo "Deploying to ${REGION}. Cache Clear: ${CLEAR_CACHE}"
    }
}
```

### D. Best Practice: The `timeout` Safety Net
**Never** use `input` without a `timeout`. If no one is available to approve, the pipeline could sit idle for days, blocking build agents and wasting resources.

```groovy
stage('Time-Limited Approval') {
    options {
        timeout(time: 1, unit: 'HOURS') // Automatically abort if no input in 1 hour
    }
    input { message "Review security logs and approve." }
    steps { sh './finalize.sh' }
}
```

### E. Industrial Scenario: The "Four-Eyes" Principle
> **The Context:** A banking application requires two people to touch every release: **The Developer** (who triggers the build) and **The Release Manager** (who approves it).
>
> **The Process:**
> 1. Jenkins builds and tests the code automatically.
> 2. The pipeline stops at the "Approval" stage.
> 3. The Release Manager receives a notification, reviews the test results, and clicks "Approve."
> 4. Only then does the deployment proceed.
>
> **The Result:** Compliance with financial regulations and a significantly lower risk of accidental production errors.

---

## 10. The `parameters` Directive: User-Driven Automation

While environment variables are set by the system, **`parameters`** are set by the **User**. This allows you to create a single, flexible pipeline that can behave differently based on what the person running the build chooses (e.g., "Deploy to QA" vs. "Deploy to Production").

### A. Common Parameter Types

#### 1. `string` & `text`
- `string`: A single line of text (e.g., a branch name or Git tag).
- `text`: Multi-line input (e.g., release notes or a list of server IPs).
```groovy
parameters {
    string(name: 'DEPLOY_TAG', defaultValue: 'v1.0.0', description: 'Enter the Git Tag to deploy')
}
```

#### 2. `choice` (The Dropdown)
Provides a predefined list of options to prevent user typos.
```groovy
parameters {
    choice(name: 'ENVIRONMENT', choices: ['DEV', 'STAGING', 'PROD'], description: 'Pick target environment')
}
```

#### 3. `booleanParam` (The Checkbox)
A simple on/off switch.
```groovy
parameters {
    booleanParam(name: 'RUN_SONAR_SCAN', defaultValue: true, description: 'Skip static analysis?')
}
```

#### 4. `password`
Masked input for one-time sensitive data (like a temporary database migration token).
```groovy
parameters {
    password(name: 'TEMP_DB_KEY', description: 'Enter the migration token')
}
```

### B. Accessing Parameters: The `params` Object
In your stages, you should always access these via the `params` object. This makes it clear that the value came from a user prompt.

```groovy
stage('Deploy') {
    steps {
        echo "Deploying version ${params.DEPLOY_TAG} to ${params.ENVIRONMENT}"
    }
}
```

### C. The "Catch-22" (Technical Nuance)
When you first add a `parameters` block to your `Jenkinsfile`, you won't see the "Build with Parameters" button in the Jenkins UI immediately.
1.  **Build 1:** You must run the build once normally. Jenkins "reads" the file and finds the parameters.
2.  **Build 2:** From now on, the button appears, and the user can provide inputs.

### D. Industrial Scenario: The "Emergency Rollback"
> **The Context:** A high-traffic e-commerce site has a bug in production. They need to roll back to the last stable version **instantly**.
>
> **The Strategy:** The pipeline contains a `choice` parameter for "Action" (`Deploy`, `Rollback`) and a `string` parameter for `VERSION_NUMBER`.
>
> **The Process:**
> - The engineer selects `Rollback`.
> - Opens the `VERSION_NUMBER` field and types `v2.4.1`.
> - Clicks "Build."
>
> **The Result:** Jenkins fetches the specific Docker image for `v2.4.1` and points the load balancer at it, fixing the site within seconds without needing a code commit.

---

## 11. Stash and Unstash: Passing Files Between Agents

In a distributed Jenkins environment, different stages might run on different physical servers or Docker containers. By default, these environments do **not** share files. The **`stash`** and **`unstash`** directives allow you to save a set of files and move them to another stage or agent during the same build.

### A. The Core Concepts
- **`stash`**: Saves a set of files for use later in the same pipeline.
- **`unstash`**: Retrieves those saved files and places them into the current workspace.

### B. Why Use Stash Instead of Artifacts?
| Feature | **Stash / Unstash** | **Archive Artifacts** |
| :--- | :--- | :--- |
| **Purpose** | Temporary file sharing *during* the build. | Permanent storage *after* the build. |
| **Lifecycle** | Deleted after the pipeline finishes. | Kept in Jenkins history until discarded. |
| **Storage** | Highly optimized for speed. | Optimized for long-term archiving/audit. |

### C. Syntax & Usage
```groovy
stage('Build') {
    agent { label 'heavy-builder' }
    steps {
        sh 'mvn clean install'
        // Save the compiled JAR
        stash name: 'app-binaries', includes: 'target/*.jar'
    }
}

stage('Test') {
    agent { label 'small-tester' }
    steps {
        // Retrieve the compiled JAR
        unstash 'app-binaries'
        sh 'java -jar target/myapp.jar --test'
    }
}
```

### D. Advanced Stash Logic (Includes/Excludes)
You can use Ant-style patterns to precisely choose what to stash.
```groovy
stash name: 'frontend-assets', 
      includes: 'dist/**, public/*.html', 
      excludes: 'dist/**/*.map'
```

### E. Industrial Scenario: Build Once, Test Everywhere
> **The Context:** A gaming company builds a multi-player engine. The build process takes 20 minutes on a high-spec Linux node.
> **The Problem:** They need to test the same build on **Windows**, **Linux**, and **MacOS** simultaneously to ensure cross-platform compatibility.
> 
> **The Solution:**
> 1.  **Stage (Build):** Run on the Linux powerhouse. `stash` the binaries.
> 2.  **Stage (Parallel Test):** Three parallel stages run on three different agents. Each one calls `unstash` to get the exact same code and runs its specific test suite.
> 
> **The Result:** Guaranteed consistency across platforms using the exact same binary, while reducing total build time via parallelism.

### F. Technical Best Practices
1.  **Unique Names:** Every stash in a pipeline must have a unique name.
2.  **Size Limits:** Stashes are stored on the Jenkins Controller disk. Avoid stashing large datasets (e.g., 2GB Docker images); use an external registry or S3 for large files.
3.  **Default Excludes:** Jenkins automatically excludes `.git` and other SCM metadata by default.

---

## 12. Parallel Execution: Maximizing Pipeline Efficiency

In a professional CI/CD pipeline, time is your most valuable resource. The **`parallel`** block allows you to run multiple stages at the exact same time, significantly reducing the total duration of your build.

### A. Basic Syntax
You define a parent stage that contains a `parallel` block, which in turn contains the sub-stages.

```groovy
stage('Global Testing') {
    parallel {
        stage('Unit Tests') {
            steps { sh 'mvn test' }
        }
        stage('Static Analysis') {
            steps { sh 'npm run lint' }
        }
    }
}
```

### B. The `failFast` Optimizaton
By default, if one parallel branch fails, Jenkins waits for all other branches to finish before marking the whole pipeline as failed. With `failFast true`, Jenkins will instantly abort all other branches as soon as one fails, saving agent time.

```groovy
stage('Parallel Tests') {
    failFast true
    parallel {
        stage('Integration') { steps { sh './run-int-tests.sh' } }
        stage('Security') { steps { sh './run-sec-scan.sh' } }
    }
}
```

### C. Using Independent Agents
Each parallel branch can run on its own dedicated agent or Docker container. This is perfect for cross-platform testing.

```groovy
stage('Cross-Platform Verification') {
    parallel {
        stage('Linux Build') {
            agent { label 'linux-node' }
            steps { sh './build.sh' }
        }
        stage('Windows Build') {
            agent { label 'windows-node' }
            steps { bat 'build.bat' }
        }
    }
}
```

### D. Industrial Scenario: The Microservices Speed-up
> **The Context:** A company has a monorepo containing three independent microservices: `Auth`, `Catalog`, and `Order`.
> **The Problem:** Building them one by one takes 30 minutes (10 mins each).
> 
> **The Solution:** Use a `parallel` block to build all three at once.
> 
> **The Result:** The total build time drops from 30 minutes to just **10 minutes** (the time of the slowest service), allowing developers to get feedback 3x faster.

### E. Technical Best Practices
1.  **Thread Safety:** Ensure your parallel stages don't try to write to the exact same file or database concurrently without locking.
2.  **Resource Planning:** Ensure your Jenkins server has enough "Executors" configured to handle the parallel load.
3.  **Visualization:** Use the **Blue Ocean** UI for a cleaner side-by-side view of parallel progress.

---

## 13. Summary Checklist
-   **Declarative:** Use the `pipeline` keyword.
-   **Directives:** Use `agent`, `options`, and `environment` to configure.
-   **Post-build:** Always use a `post` block for cleanup and notifications.
-   **Security:** Never hardcode passwords; always use the `environment` with `credentials()`.
