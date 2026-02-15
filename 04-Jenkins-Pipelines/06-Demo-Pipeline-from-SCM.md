# Demo: Pipeline from SCM (The Real-World Standard)

In previous demos, we pasted our code directly into the Jenkins UI. In a production environment, this is **bad practice**. Instead, we store the pipeline logic in a file named `Jenkinsfile` inside our Git repository.

---

## 1. Why Move to SCM?

-   **Version Controlled**: You can see exactly what changed in your build logic and who changed it.
-   **Reviewable**: Changes to the build process can go through Code Review (Pull Requests).
-   **No UI Dependency**: If your Jenkins server crashes, your build logic isn't lost—it's safe in Git.
-   **Code Parity**: The build logic lives with the source code it is meant to build.

---

## 2. Step 1: Create the `Jenkinsfile`

We have placed a file named **`Jenkinsfile`** (no extension) in the root of the **`Simple-Maven-Application`** folder.

**The Content:**
```groovy
pipeline {
    agent any
    tools { maven 'M3912' }
    stages {
        stage('Build') { steps { sh 'mvn clean install -DskipTests' } }
        stage('Test') { 
            steps { sh 'mvn test' }
            post { always { junit '**/target/surefire-reports/*.xml' } }
        }
        stage('Archive') { steps { archiveArtifacts '**/target/*.jar' } }
    }
}
```

---

## 3. Step 2: Configure Jenkins to read from Git

Instead of "Pipeline script," we now tell Jenkins where our Git repository is.

### UI Instructions:
1.  Create a new Pipeline job named `04-Maven-SCM-Pipeline`.
2.  Scroll down to the **Pipeline** section.
3.  Change **Definition** from `Pipeline script` to **`Pipeline script from SCM`**.
4.  Set **SCM** to `Git`.
5.  **Repository URL**: Enter your Git URL (e.g., `https://github.com/Saikiran121/...`).
6.  **Branch Specifier**: Set to `*/main` (or your specific branch).
7.  **Script Path**: Ensure this is set to `Jenkinsfile` (this is the default).
8.  Click **Save**.

---

## 4. What Happens During the Build?

When you click **Build Now**, Jenkins performs a process called **"Lightweight Checkout"**:
1.  Jenkins connects to Git and pulls **only** the `Jenkinsfile`.
2.  It parses the file to understand the stages.
3.  It then starts the build, checks out the **entire** source code onto the agent, and executes the stages as defined.

---

## 5. Summary Checklist
-   [x] File named `Jenkinsfile` exists in repo root.
-   [x] Job configuration points to the Git URL.
-   [x] Branch name matches your Git default.
-   [x] Tool names in `Jenkinsfile` match Global Tool Configuration.
