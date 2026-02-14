# Verifying Jenkins Version: UI and CLI Guide

In a professional DevOps environment, knowing your specific Jenkins version is critical for plugin compatibility, security patch audits, and troubleshooting.

---

## 1. Verifying Version via User Interface (UI)

The UI is the fastest way to check the version if you have web access.

### 1.1 The Infinite Shortcut (Page Footer)
On **every single page** of the Jenkins UI, look at the bottom-right corner.
- **Location:** Desktop footer, right side.
- **Appearance:** `Jenkins 2.440.3` (Example).

### 1.2 The "About Jenkins" Page
For more details, including a list of third-party libraries and licenses:
1. Click on the **Help** (question mark) icon or your username in the top-right.
2. Select **About Jenkins**.
3. The version number will be displayed prominently at the top.

### 1.3 System Information
1. Navigate to **Manage Jenkins** > **System Information**.
2. Search for the property `jenkins.version`.
3. This is useful for verifying the version that the JVM is actually reporting.

---

## 2. Verifying Version via CLI (The DevOps Way)

When the UI is down (e.g., during an OOM crash) or when you are automating audits, use these CLI methods.

### 2.1 For Linux Package Installations (Debian/Ubuntu/RHEL)
If you installed Jenkins via `apt` or `yum/dnf`:
```bash
# Ubuntu/Debian
dpkg -l | grep jenkins

# RHEL/CentOS/Fedora
rpm -qa | grep jenkins
```

### 2.2 Using the Java Archive (`jenkins.war`)
Jenkins identifies itself through the manifest file inside the WAR file.
```bash
# Run the war file with the --version flag
java -jar /usr/share/java/jenkins.war --version
```

### 2.3 For Docker Installations
If Jenkins is running as a container, you can execute the version command inside it.
```bash
docker exec <container_id_or_name> jenkins --version
```

### 2.4 Using the Jenkins CLI Tool
If you have the `jenkins-cli.jar` configured:
```bash
java -jar jenkins-cli.jar -s http://localhost:8080/ version
```

---

## 3. Why Versioning Matters: LTS vs. Weekly

Jenkins comes in two "flavors":
- **LTS (Long-Term Support):** Chosen by enterprises for stability. Released every 12 weeks.
- **Weekly:** Chosen by developers who want the latest features and bug fixes. Released every week.

> **Corporate Scenario: The Compatibility Audit**
> A security team discovers a vulnerability in a common Jenkins plugin. The fix requires **Jenkins 2.426.1+**. 
> 
> A junior DevOps engineer is asked to check 20 different Jenkins controllers across the global network. Instead of logging into each UI, they run a simple **Ansible playbook** that executes `jenkins --version` on all 20 servers. They identify 3 outdated servers in 5 minutes, allowing for an immediate security patch.

---

## 4. Exploring "System Information" (The Diagnostic Core)

If you wanted to see the "DNA" of your Jenkins server, you would go to the **System Information** page. This is the ultimate source of truth for the underlying Java environment and the operating system.

### 4.1 Navigation
- **Path:** `Dashboard` > `Manage Jenkins` > `System Information`

### 4.2 Key Sections Breakdown

The page is divided into three critical areas:

#### A. System Properties (Java View)
This table shows the properties assigned to the **Java Virtual Machine (JVM)**. 
- **`jenkins.version`:** The definitive version of the controller.
- **`file.encoding`:** Crucial for troubleshooting "strange character" errors in build logs.
- **`user.home`:** Where the user running Jenkins expects their local data (useful for locating SSH keys).
- **`java.version`:** Detailed info about the JDK being used.

#### B. Environment Variables (OS View)
This table shows the variables provided by the **Operating System (Linux/Windows)** to the Jenkins process. 
- **`PATH`:** The most important variable. If a tool (like `git` or `docker`) isn't in this list, Jenkins cannot run it.
- **`JENKINS_HOME`:** Confirms where your data is physically stored.
- **`JAVA_HOME`:** Shows which Java installation is powering the server.

#### C. Plugins (Raw List)
A complete, unstyled list of every plugin, its version, and whether it is enabled.
> [!TIP]
> This list is designed to be **Copied and Pasted** into support tickets or security audit documents.

### 4.3 Why it Matters for DevOps Engineers
- **The "Invisible Path" Problem:** You installed a tool on the server, but the pipeline fails with `command not found`. You check "System Information" to see if Jenkins has updated its internal `PATH` variable.
- **Credential Troubleshooting:** Checking `user.name` to see if Jenkins is running as `root` (dangerous!) or as a dedicated `jenkins` user.

---

## 5. Corporate Scenario: The "Invisible Tool" Mystery

> **The Scenario:** A DevOps team at a shipping company installs a new version of **Terraform** on their Linux build server. They verify it works in their terminal. However, every Jenkins pipeline still fails with `terraform: command not found`.
>
> **The Investigation:** The lead engineer navigates to **Manage Jenkins > System Information** and checks the **Environment Variables** table.
>
> **The Discovery:** They find that the `PATH` variable visible to Jenkins still points to the old directories and doesn't include `/usr/local/bin/terraform`. Jenkins was started *before* the new tool was added to the profile.
>
> **The Fix:** They restart the Jenkins service to refresh the environment variables from the OS.
>
> **The Result:** The pipelines immediately start working. A 5-minute check of "System Information" saved hours of debugging "phantom" installation issues.

---

## 6. Understanding "System Log" (The Live Stream)

While "System Information" shows the static state of Jenkins, the **System Log** is a live, streaming view of every event happening under the hood. It is your primary tool for catching errors as they happen.

### 6.1 Navigation
- **Path:** `Dashboard` > `Manage Jenkins` > `System Log`

### 6.2 Key Features

#### A. All Jenkins Logs
The default view that aggregates logs from the Jenkins core and every installed plugin. 
- **Use Case:** "Is Jenkins trying to do *something* right now?"

#### B. Log Recorders (Custom Filters)
One of the most powerful features for senior DevOps engineers. You can create a **New Log Recorder** to focus on a specific component.
- **Example:** Create a recorder named "Git-Debug" and set the logger to `hudson.plugins.git` at the `FINE` level. This will show you every single interaction with your SCM without the noise of the rest of the system.

#### C. Log Levels
Jenkins follows standard Java logging levels:
- **SEVERE:** Critical errors (e.g., database connection failed, data corruption).
- **WARNING:** Non-fatal issues (e.g., a plugin is outdated or a worker node disconnected unexpectedly).
- **INFO:** Standard status updates (e.g., "Build #45 started").
- **FINE/FINER/FINEST:** Debugging information. These are **hidden by default** to save memory and only appear if you create a custom Log Recorder.

### 6.3 UI vs. CLI Logs
| Feature | UI (System Log) | CLI (`/var/log/jenkins/jenkins.log`) |
| :--- | :--- | :--- |
| **Access** | Requires Jenkins Admin permissions. | Requires SSH and OS-level permissions. |
| **Streaming** | Real-time "Tail" in the browser. | Requires `tail -f`. |
| **Filtering** | Easy via "Log Recorders." | Requires complex `grep` or `awk` commands. |
| **History** | Limited to the recent buffer. | Unlimited (based on log rotation policy). |

---

## 7. Corporate Scenario: The "Silent Pipeline Failure"

> **The Scenario:** An e-commerce team’s deployment pipeline is failing. The "Console Output" of the job is completely empty—no error, just a spinny wheel that eventually results in an "Aborted" status.
>
> **The Investigation:** The DevOps lead goes to **Manage Jenkins > System Log**. In the "All Jenkins Logs" view, they see a repeated message:
> `WARNING: hudson.plugins.ssh.SshConnector: Connection timed out for agent-east-01`
>
> **The Discovery:** The problem wasn't in the pipeline code; it was a networking timeout between the Controller and the Agent that the "Job Log" was too early to catch.
>
> **The Fix:** They check the cloud security groups, find a blocked port, and re-open it.
>
> **The Result:** The logs immediately show the connection re-establishing, and the pipeline starts running. By looking at the **System Log**, the team fixed a networking issue without wasting hours debugging application code.

---

## 8. Summary Checklist
- **UI:** Bottom-right corner.
- **CLI (Native):** `jenkins --version` or `dpkg/rpm`.
- **CLI (Java):** `java -jar jenkins.war --version`.
