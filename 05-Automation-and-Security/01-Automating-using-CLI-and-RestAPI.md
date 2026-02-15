# Automating Jenkins using CLI and REST API

Automation is the heart of DevOps. While the Jenkins UI is great for visualization, professional Jenkins Engineers use the **CLI (Command Line Interface)** and **REST API** to manage jobs, trigger builds, and audit configurations programmatically.

---

## 🖥️ The Jenkins CLI JAR: A Deep Dive

The Jenkins CLI is a **Java client application** (`jenkins-cli.jar`) that allows you to control your Jenkins controller from any computer that has a Java Runtime Environment (JRE).

### 1. How it Works
- **Protocol**: It communicates with the Jenkins controller primarily over **HTTP/S**.
- **Client-Side**: It is a "thin client." It doesn't contain Jenkins logic; it simply translates your CLI commands into API requests that the server understands.
- **Portability**: Because it's a JAR file, it runs on Linux, Windows, and macOS.

### 2. How to Download the CLI JAR
You don't need to look online for the JAR; every Jenkins controller provides its own version-matched CLI tool:
1.  Navigate to your Jenkins Dashboard.
2.  Go to **Manage Jenkins** -> **Jenkins CLI**.
3.  Click the link: **`jenkins-cli.jar`** to download it.
4.  Alternatively, download via terminal:
    ```bash
    wget http://localhost:8080/jnlpJars/jenkins-cli.jar
    ```

---

## 🔐 Authentication: The "Login" Process

Jenkins CLI does not have a persistent `login` command. Instead, you must provide identity for every command you run.

### Method 1: API Token (The "-auth" flag)
The easiest way to authenticate is using your Jenkins username and an **API Token** (found under your User Profile -> Settings -> API Token).
```bash
java -jar jenkins-cli.jar -s http://localhost:8080/ -auth <username>:<api_token> <command>
```

### Method 2: SSH Keys (The Professional Choice)
For background scripts and cron jobs, SSH keys are preferred because they don't require credentials in the command string:
1.  Generate an SSH key pair locally: `ssh-keygen`.
2.  Copy your public key (`id_rsa.pub`).
3.  In Jenkins UI, go to **User Profile** -> **Configure** -> **SSH Public Keys** and paste it.
4.  Run CLI commands without `-auth`:
    ```bash
    java -jar jenkins-cli.jar -s http://localhost:8080/ -ssh -i ~/.ssh/id_rsa <command>
    ```

---

## 🛠️ Essential CLI Commands

### 1. Identify Your Session
Verify who Jenkins thinks you are:
```bash
java -jar jenkins-cli.jar -s http://localhost:8080/ -auth admin:TOKEN who-am-i
```

### 2. List All Jobs
Useful for inventory auditing:
```bash
java -jar jenkins-cli.jar -s http://localhost:8080/ -auth admin:TOKEN list-jobs
```

### 3. Build a Project (The Core Command)
To trigger a build from your terminal:
```bash
java -jar jenkins-cli.jar -s http://localhost:8080/ -auth admin:TOKEN build "My-Pipeline-Job"
```

**Parameterized Builds**:
If your pipeline has parameters (like `BRANCH_NAME`), pass them with the `-p` flag:
```bash
java -jar jenkins-cli.jar -s http://localhost:8080/ -auth admin:TOKEN build "My-Job" -p BRANCH_NAME=main -p APP_PORT=8093
```

---

## 🌐 Jenkins REST API: The Power User's Interface

Jenkins exposes a comprehensive Remote Access API. Since "Everything in Jenkins is an Object," everything can be queried or triggered via standard HTTP methods.

### 1. The Architecture
Every page in the Jenkins UI has an equivalent API endpoint.
- **Classic UI**: `http://localhost:8080/job/My-Job/`
- **JSON API**: `http://localhost:8080/job/My-Job/api/json`
- **XML API**: `http://localhost:8080/job/My-Job/api/xml`
- **Python-friendly**: `http://localhost:8080/job/My-Job/api/python` (Python literal format)

---

### 2. High-Performance Querying: The `tree` Parameter
In large Jenkins environments (thousands of jobs), fetching a full `api/json` is slow and wastes bandwidth. You should ALWAYS use the `tree` parameter to filter only the fields you need.

**Example: Get only the names and colors (status) of all jobs:**
```bash
curl -s "http://localhost:8080/api/json?tree=jobs\[name,color\]"
```
**Example: Get the last build number and its result:**
```bash
curl -s "http://localhost:8080/job/My-Job/api/json?tree=lastBuild\[number,result\]"
```

---

### 3. Security: CSRF Protection (The "Crumb")
Most Jenkins installations have "CSRF Protection" enabled. This prevents unauthorized scripts from performing state-changing actions (POST requests).

To perform a POST (like building a job), you must first fetch a **Security Crumb**.

**Step 1: Fetch the Crumb**
```bash
# This returns something like: Jenkins-Crumb:abc123456...
curl -u "user:token" "http://localhost:8080/crumbIssuer/api/xml?xpath=concat(//crumbRequestField,\":\",//crumb)"
```

**Step 2: Use the Crumb in the Header**
```bash
curl -u "user:token" -H "Jenkins-Crumb:abc123456..." -X POST "http://localhost:8080/job/My-Job/build"
```

---

### 4. Remote Parameterized Builds
When you need to trigger a build and pass values (like different ports or branches), use the `buildWithParameters` endpoint.

```bash
curl -X POST "http://localhost:8080/job/My-Job/buildWithParameters?BRANCH_NAME=develop&APP_PORT=9000"
```

---

### 5. Auditing: Fetching Logs and Artifacts
The REST API allows you to monitor build health without opening a browser.

- **Console Log (Text)**: `http://localhost:8080/job/My-Job/lastBuild/consoleText`
- **Check Status**: `http://localhost:8080/job/My-Job/lastBuild/api/json?tree=building,result`
- **Download Artifact**: `http://localhost:8080/job/My-Job/lastBuild/artifact/target/app.jar`

---

## 💡 Key Takeaways
- **Performance**: Use `tree` to keep your scripts fast and light.
- **Automation**: Use **API Tokens** for `curl` requests to avoid exposing your real password.
- **CSRF**: Always check if the `crumbIssuer` is active when writing external integrations.
- **Language Agnostic**: Use JSON for Python/JavaScript and XML for legacy Java tools.
