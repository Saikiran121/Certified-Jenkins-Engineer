# Demo: Creating a Parameterized Pipeline

Parameterized pipelines allow you to make your CI/CD workflows interactive. Instead of hardcoding values (like ports or branch names), you can prompt the user for input before the build starts.

---

## ⚙️ Step 1: Configure Parameters in Jenkins UI

To enable parameters for your pipeline:

1.  Navigate to your Pipeline job in the Jenkins Dashboard.
2.  Click **Configure** in the sidebar.
3.  Check the box: **"This project is parameterized"**.
4.  Click the **Add Parameter** dropdown.

### A. Adding a String Parameter (Branch Name)
1.  Select **String Parameter**.
2.  **Name**: `BRANCH_NAME`
3.  **Default Value**: `main`
4.  **Description**: `The git branch on which the build and deployment happens.`

### B. Adding a String Parameter (App Port)
1.  Select **String Parameter**.
2.  **Name**: `APP_PORT`
3.  **Default Value**: `8093`
4.  **Description**: `Select the application port on which integration test should happen.`

### C. Adding a Choice Parameter (Sleep Time)
1.  Select **Choice Parameter**.
2.  **Name**: `SLEEP_TIME`
3.  **Choices**: 
    ```text
    5s
    10s
    15s
    20s
    25s
    ```
4.  **Description**: `Time to sleep before initiating integration test.`

---

## 📜 Step 2: Update the Jenkinsfile

To use these parameters in your script, access them via the global `params` object.

```groovy
stage('Integration Testing') {
    steps {
        echo "Waiting for ${params.SLEEP_TIME}..."
        sh "sleep ${params.SLEEP_TIME}"
        
        echo "Testing endpoint on port ${params.APP_PORT}..."
        sh "curl -s http://localhost:${params.APP_PORT}"
    }
}
```

---

## 🚀 Step 3: Running the Build

1.  Once saved, the "Build Now" button in the sidebar will change to **Build with Parameters**.
2.  Click it, select your desired values from the UI, and click **Build**.
3.  Jenkins will inject these values into your pipeline execution.

---

## 🛠️ Troubleshooting: Why did my pipeline fail with Exit Code 7?

If you see `ERROR: script returned exit code 7` in your Jenkins console log during the `curl` step, it means **Connection Refused**.

### The Cause
By default, Jenkins building a JAR doesn't mean the JAR is **running**. `curl` tries to talk to `localhost:8093`, but no one is listening.

### The Fix: Background Execution
In your `Jenkinsfile`, you must start the application in the background using `nohup` and the `&` symbol. 

> [!IMPORTANT]
> **Process Killer Protection**: Jenkins automatically kills all processes started by a job when it finishes. To keep your app running long enough for the test, use the environment variable `JENKINS_NODE_COOKIE=dontKillMe`.

### Updated Jenkinsfile Logic:
```groovy
stage('Run Application') {
    steps {
        sh "JENKINS_NODE_COOKIE=dontKillMe nohup java -jar target/*.jar &"
    }
}
```
*Note: We use `fuser -k port/tcp` in the `post` block to manually clean up the process afterward.*

---

## 💡 Key Takeaways
- **Flexibility**: One pipeline can now handle different environments (Dev/Stage/Prod) just by changing the `APP_PORT`.
- **User Control**: Choice parameters prevent typos and ensure users select only supported configurations (e.g., specific sleep intervals).
- **Environment Parity**: You can use the same build logic across multiple branches by passing the `BRANCH_NAME` at runtime.
