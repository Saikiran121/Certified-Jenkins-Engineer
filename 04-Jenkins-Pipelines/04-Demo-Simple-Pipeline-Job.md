# Hands-on Demo: Creating Your First Jenkins Pipeline

This guide provides a step-by-step walkthrough for creating simple pipelines and resolving common configuration issues.

---

## Demo 1: The "Hello World" Pipeline

This demo introduces the basic UI flow for creating a Pipeline-as-Code project directly in the Jenkins web interface.

### Step 1: Create the Job
1.  On the Jenkins Dashboard, click **New Item**.
2.  Enter the name: `01-Hello-World-Pipeline`.
3.  Select **Pipeline** as the item type and click **OK**.

### Step 2: Define the Pipeline
1.  Scroll down to the **Pipeline** section.
2.  Ensure **Definition** is set to `Pipeline script`.
3.  From the **try sample Pipeline...** dropdown, select `Hello World`.
4.  The editor will populate with this code:

```groovy
pipeline {
    agent any

    stages {
        stage('Hello') {
            steps {
                echo 'Hello World'
            }
        }
    }
}
```

### Step 3: Run and Verify
1.  Click **Save** and click **Apply**.
2.  Click **Build Now** on the left sidebar.
3.  Click on the build number (e.g., `#1`) and select **Console Output**.
4.  **The Result:** You should see `Hello World` printed in the logs.

---

## Demo 2: Maven Tooling & Troubleshooting

In production, you often need specific build tools (Maven, JDK, Node). This demo shows how to configure these tools globally and use them in a pipeline.

### Step 1: Create the Project
1.  Create a new Pipeline item named `02-Maven-Version-Check`.
2.  Add the following script to the definition:

```groovy
pipeline {
    agent any

    tools {
        // This tells Jenkins to look for a tool named "M3" in Global settings
        maven "M3"
    }
    
    stages{
        stage('Echo Version') {
            steps {
                sh 'echo Print Maven Version'
                sh 'mvn -version'
            }
        }
    }
}
```

### Step 2: The Intentional Error
1.  Click **Save** and click **Build Now**.
2.  The build will **FAIL** with an error:
    > `Tool type "maven" does not have an install of "M3" configured`

### Step 3: The Fix (Global Tool Configuration)
1.  Go to **Manage Jenkins** -> **Tools**.
2.  Scroll down to **Maven installations**.
3.  Click **Add Maven**.
    -   **Name**: `M3912` (Note: This must match the name in your script exactly).
    -   **Install automatically**: Checked.
    -   **Version**: Select `3.9.6` (or any recent version).
4.  Click **Apply** and click **Save**.

### Step 4: Correct the Pipeline
1.  Go back to your `02-Maven-Version-Check` job.
2.  Click **Configure**.
3.  Change the `tools` block to match the new name:
```groovy
    tools {
        maven "M3912"
    }
```
4.  Click **Save** and click **Build Now**.

### Step 5: Verify
1.  Check the **Console Output**.
2.  **The Result:** Jenkins will automatically download Maven, unzip it, and successfully print the version details in the logs.

---

## Key Learning Highlights
- **Human Error:** Tool names in the `Jenkinsfile` MUST match the names in the **Tools** configuration exactly.
- **Automation:** The `tools` directive automatically injects the tool's binary path into the `$PATH` environment variable for that build.
