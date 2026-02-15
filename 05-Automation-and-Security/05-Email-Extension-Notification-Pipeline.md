# Pipeline: Advanced Email with Email Extension Plugin

In Declarative Pipelines, we use the **`emailext`** step (part of the Email Extension plugin) to send professional, automated notifications. Unlike the basic `mail` step, `emailext` allows for HTML reports, build log attachments, and dynamic content.

---

## 🏗️ 1. Basic Syntax

The `emailext` step is used inside a `script` block or directly in `post` actions.

```groovy
emailext (
    to: 'dev-team@example.com',
    subject: "Build Status: ${currentBuild.fullDisplayName}",
    body: "The build ${currentBuild.currentResult} for job ${env.JOB_NAME}. \nMore info: ${env.BUILD_URL}",
    mimeType: 'text/html'
)
```

---

## 📜 2. Integration in the `post` Block

The most efficient way to use email is within the global `post` section. This ensures notifications are sent automatically based on the build outcome.

```groovy
pipeline {
    agent any
    
    stages {
        stage('Build') {
            steps {
                echo 'Building...'
            }
        }
    }

    post {
        success {
            emailext (
                to: 'saikiran@example.com',
                subject: "✅ SUCCESS: ${env.JOB_NAME} [${env.BUILD_NUMBER}]",
                body: "Great news! The build passed successfully. <br> View details: <a href='${env.BUILD_URL}'>Click here</a>",
                mimeType: 'text/html'
            )
        }
        
        failure {
            emailext (
                to: 'saikiran@example.com',
                subject: "❌ FAILURE: ${env.JOB_NAME} [${env.BUILD_NUMBER}]",
                body: "Attention! The build failed. Please check the attached log.",
                attachLog: true, // Attaches the console output
                mimeType: 'text/html'
            )
        }
    }
}
```

---

## 🛠️ 3. Key Parameters Explained

| Parameter | Purpose |
| :--- | :--- |
| **`to`** | Recipient list (comma-separated). You can use `$DEFAULT_RECIPIENTS`. |
| **`subject`** | The email title. Use `${env.JOB_NAME}` for dynamic titles. |
| **`body`** | The message content. Supports HTML if `mimeType` is set. |
| **`attachLog`** | Set to `true` to attach the full console output as a `.txt` file. |
| **`mimeType`** | Set to `'text/html'` for rich formatting or `'text/plain'` for raw text. |
| **`compressLog`** | (Optional) Set to `true` to zip the attached log to save space. |

---

## 💡 Industrial Tips

1.  **Centralize Configuration**: Keep your SMTP server settings (Gmail/Outlook) in **Manage Jenkins -> System** so your Pipeline scripts stay clean.
2.  **Use Blue Ocean Links**: Instead of `${env.BUILD_URL}`, many teams preferred the Blue Ocean UI link for better visualization of failures.
3.  **Credential Safety**: Never hardcode email passwords in the script. Use the **Jenkins Credentials Store** and configure them globally in the "Extended E-mail Notification" section.

---

## 🚀 Verification Result
When your pipeline fails, you will see a log entry like this:
```text
[Pipeline] emailext
Sending email to: saikiran@example.com
```
And your inbox will contain the **HTML report** along with the **build log attached**.
