# Troubleshooting Jenkins Performance: JVM Tuning & OutOfMemory (OOM)

## 1. The Nightmare Scenario: Infinite Reload & HTTP 500

At some point in your DevOps career, you will encounter a Jenkins server that is "Stuck." 

### The Symptoms:
- **Infinite Reload:** The browser keeps spinning, but the Jenkins UI never loads.
- **HTTP 500 Error:** You see `jakarta.servlet.ServletException: unexpected exception`.
- **The "Caused By" Line:** In the logs (`/var/log/jenkins/jenkins.log`), you see the dreaded:
  `java.lang.OutOfMemoryError: Java heap space` or `java.lang.OutOfMemoryError: Metaspace`.

### 1.1 How to Check for OOM via CLI (The DevOps Way)

If you cannot access the Jenkins UI, you must use the command line to "Listen" to the application.

#### A. Using `grep` on Log Files (Standard Linux)
The most direct way to find the error is to search the Jenkins log file.
```bash
# Search for the specific OutOfMemory string
grep -i "OutOfMemoryError" /var/log/jenkins/jenkins.log

# View the last 100 lines of the log for context
tail -n 100 /var/log/jenkins/jenkins.log
```

#### B. Using `journalctl` (Systemd Systems)
If Jenkins is running as a systemd service (Ubuntu 16.04+, RHEL 7+), use journalctl:
```bash
# Search logs for the Jenkins service specifically
journalctl -u jenkins | grep -i "heap"

# Broader search for "OutOfMemory" or other capacity issues
journalctl -u jenkins | grep -i "out"

# Follow the logs in real-time as you try to reload the UI
journalctl -u jenkins -f
```

#### C. Using `dmesg` (Kernel Level)
Sometimes the Linux Kernel's **OOM Killer** will kill the Jenkins process before it can even write to its own log. `dmesg` shows kernel-level kills.
```bash
dmesg -T | grep -i "killed process"
# If you see "java" or "jenkins" here, the OS forced it to stop due to lack of RAM.
```

#### D. Monitoring with `top` or `htop`
Check the live RAM usage of the Java process.
```bash
top -p $(pgrep -d',' -f jenkins)
# Watch the %MEM column. If it hits 90%+, OOM is imminent.
```

---

## 2. Understanding Jenkins Memory Architecture

Jenkins runs on the **Java Virtual Machine (JVM)**. To solve memory issues, you must understand where the RAM is actually going:

1.  **Heap Memory:** This is where Jenkins stores "live" objects—build history, internal data structures, and plugin instances. 
    - *When it fails:* You get `OOM: Java heap space`.
2.  **Metaspace Memory:** This is where the JVM stores "Class Metadata" (the structure of the plugins and Jenkins core). 
    - *When it fails:* You get `OOM: Metaspace`.

### Why does OOM happen?
- **Plugin Overload:** Installing 100+ plugins without increasing RAM.
- **Build History Bloat:** Keeping 10,000 builds in history instead of using "Discard Old Builds."
- **Heavy XML Processing:** Large pipelines with massive payloads can temporarily spike memory usage.

---

## 3. Will I Lose My Data? (Disk vs. RAM)

One of the biggest fears during an OOM crash or an "Infinite Reload" scenario is data loss. The short answer is: **Your configuration, pipelines, and logs are safe.**

### 3.1 The "Gold" is on the Disk
As discussed in the **`JENKINS_HOME`** section, Jenkins is a "FileSystem-based" application. 
- **Persistent Data:** Your Pipeline scripts, Job configurations, User information, and Console Logs for *completed* builds are stored as **XML and text files on the Hard Drive/SSD**.
- **Transient Data:** An OOM error only affects the **RAM (Heap)**. It crashes the "process" that reads and displays the data, but it does NOT delete the files on the disk.

### 3.2 What IS Lost?
While the configurations are safe, some runtime information is lost:
1.  **Currently Running Jobs:** If a job was mid-execution when the OOM happened, it will likely be **Aborted** or marked as "Failed/Aborted" when Jenkins restarts.
2.  **Unsaved UI Changes:** If you were in the middle of editing a job configuration and hadn't clicked "Save" or "Apply" yet, those changes are lost.
3.  **Real-time Console Output:** The logs for the *currently running* build might be truncated or lost for the specific phase that was in RAM when the crash occurred.

> [!NOTE]
> Think of it like a **Word Document**: If your computer crashes before you hit "Save," you lose your recent typing (RAM), but the file you saved 10 minutes ago is still safely on your hard drive (Disk).

---

## 4. Tuning the "Engine": JVM Arguments

To fix OOM, you must manually tell the JVM how much memory it is allowed to use. These are called **JVM Arguments**.

### Core Settings:
- **`-Xms` (Initial Heap):** The amount of RAM allocated when Jenkins starts.
- **`-Xmx` (Maximum Heap):** The absolute limit. If Jenkins tries to cross this, it will crash or throw a 500 error.
- **`-XX:MaxMetaspaceSize`:** Limits the memory used for class definitions (crucial for Jenkins since every plugin adds classes).

> [!TIP]
> **The 25% Rule:** For a large production Jenkins server, never allocate more than 75% of the total system RAM to the JVM. The remaining 25% is needed for the OS and external processes.

---

## 4. Jenkins Memory Sizing Guide

"Right-sizing" your Jenkins server is an art. Too little RAM leads to crashes; too much RAM leads to slow performance due to Garbage Collection pauses. 

### 4.1 Minimum vs. Recommended Values

| Scale | Team Size | Recommended RAM | Recommended Heap (`-Xmx`) |
| :--- | :--- | :--- | :--- |
| **Micro** | Personal / Learning | 2 GB | **1 GB** (Absolute Floor) |
| **Small** | 5 - 20 Developers | 8 GB | **4 GB** |
| **Medium** | 20 - 100 Developers | 16 - 32 GB | **8 - 12 GB** |
| **Large** | 100+ Developers | 64 GB+ | **16 - 24 GB** (Max recommended for a single node) |

### 4.2 The "Too Much RAM" Paradox
You might think, *"I have 128GB of RAM, let me give 100GB to Jenkins!"* **Do not do this.**
- **Why?** When the Java Heap is massive (e.g., 64GB+), the "Garbage Collector" (the process that cleans up unused memory) has to work much harder. 
- **The Result:** Jenkins might "Freeze" for 30-60 seconds while it cleans up that massive space. This is called a **Stop-the-World GC Pause**, and it makes Jenkins feel laggy.
- **The Solution:** In large enterprises, instead of making one massive Jenkins server, we use **Distributed Architecture** (one Controller with many Agents) to spread the load.

### 4.3 The "75% Rule" for Headroom
Always ensure the Operating System (Linux/Windows) has enough "Headroom" to breathe. 
- If your server has **8GB** total RAM, set `-Xmx` to **6GB**.
- If your server has **16GB** total RAM, set `-Xmx` to **12GB**.
- **Never** allocate 100% of the RAM to the JVM, or the OS will become unstable and trigger the **OOM Killer**.

---

## 5. How to Apply the Fix

### Linux (Debian/Ubuntu/RHEL)
Edit the environment configuration file:
```bash
sudo vi /etc/default/jenkins
# Locate the JAVA_ARGS variable and update:
JAVA_ARGS="-Xms2g -Xmx4g -XX:MaxMetaspaceSize=512m"
```

### Windows
Edit the `jenkins.xml` file in the installation directory:
```xml
<arguments>-Xms2g -Xmx4g -XX:MaxMetaspaceSize=512m -jar "%BASE%\jenkins.war" ...</arguments>
```

### Docker
Pass the `JAVA_OPTS` environment variable:
```bash
docker run -e JAVA_OPTS="-Xms2g -Xmx4g" jenkins/jenkins:lts
```

---

## 5. Corporate Scenario: The Scaling Pains

> **The Scenario:** A fintech startup’s DevOps team installs a new "Security Scanning" plugin and a "Global Search" plugin. Suddenly, the 400 developers on the team start seeing "HTTP 500 Error" and the UI starts infinitely reloading during peak hours.
>
> **The Investigation:** The DevOps engineer checks the logs and finds `java.lang.OutOfMemoryError: Java heap space`.
>
> **The Fix:**
> 1. They increase the physical RAM of the server from 8GB to 16GB.
> 2. They update the JVM arguments to set **`-Xmx12g`** (Maximum Heap) and **`-Xms4g`**.
> 3. They also implement a "Discard Old Builds" policy across all 2,000 jobs to clear out old XML files stored in memory.
>
> **The Result:** The infinite reload stops immediately. The server remains stable even during high-load periods when multiple security scans are running at once.

---

## 6. Summary: The Stability Checklist
1. **Monitor Logs:** Always look for `OOM` in the logs first.
2. **Right-Size Xmx:** Don't just set it to "Infinity"; set it based on actual usage.
3. **Discard History:** Clean up old builds to free up Heap memory.
4. **Clean Metaspace:** If installing many plugins, ensure `MaxMetaspaceSize` is at least 512MB.
