# Jenkins Build Timeout Plugin: Preventing "Zombie Jobs"

In a high-traffic Jenkins environment, executors are precious resources. If a job hangs indefinitely, it blocks other teams from building their code. The **Build Timeout Plugin** is the primary safety net to prevent this resource wastage.

---

## 1. What is a "Zombie Job"?

A "Zombie Job" is a build process that is technically "running" but is doing absolutely nothing. 
- **The Problem:** It stays in the "Building" state forever, consuming a Jenkins Executor.
- **The Impact:** Other jobs are queued (waiting), and the server's CPU/RAM may be slowly leaking.

### Common Causes:
- **Deadlocked Code:** A multi-threaded test that gets stuck in a loop.
- **Unresponsive External APIs:** A deployment script waiting for a response from a server that is down.
- **Interactive Prompts:** A script waiting for "Yes/No" input in a headless environment.

---

## 2. Using the Build Timeout Plugin

The plugin allows you to set rules on when Jenkins should automatically "kill" a job.

### 2.1 Freestyle Jobs (UI Configuration)
1. Go to your Job configuration.
2. Under **Build Environment**, check the box **"Abort the build if it's stuck"**.
3. Select a **Timeout strategy** (see below).

### 2.2 Pipeline Jobs (Scripted & Declarative)
You don't need to check boxes in the UI for Pipelines; you can define the timeout directly in code.

**Declarative Pipeline:**
```groovy
pipeline {
    agent any
    options {
        timeout(time: 30, unit: 'MINUTES') 
    }
    stages {
        stage('Deploy') {
            steps {
                echo 'Deploying...'
            }
        }
    }
}
```

**Scripted Pipeline:**
```groovy
timeout(time: 1, unit: 'HOURS') {
    node {
        sh './long-running-script.sh'
    }
}
```

---

## 3. Timeout Strategies (How to measure)

The plugin offers multiple ways to define what "stuck" means:

1.  **Absolute:** The most common. You set a fixed time (e.g., 20 minutes). If the build exceeds this, it is killed.
2.  **Elastic:** Jenkins looks at the last 3 successful builds and calculates the average. If the current build takes significantly longer (e.g., 200% of the average), it is killed.
3.  **Likely Stuck:** Sets a timeout based on a percentage of the average build duration.
4.  **No Activity:** Kills the build if the **Console Log** hasn't received a new line of text for X seconds. (Perfect for catching silent hangs).

---

## 4. Actions on Timeout

What should Jenkins do when the timer runs out?
- **Abort (Default):** Stops the build and marks it as **Aborted** (Grey color).
- **Fail:** Stops the build and marks it as **Failure** (Red color).
- **Writing a Message:** Adds a custom note in the console log explaining why it was killed (e.g., *"Build timed out after 30 mins - check external API connectivity"*).

---

## 5. Corporate Scenario: The Friday Evening Resource Leak

> **The Scenario:** A retail company has a massive suite of 2,000 Selenium UI tests. On a Friday evening, a developer commits code that accidentally triggers a **database deadlock** during the test phase.
>
> **The Consequence:** The build starts at 6:00 PM. Normally it takes 20 minutes. Because there is no timeout, it stays "running" all weekend. It consumes the only Mac Mini agent available for mobile builds.
>
> **The Result:** On Saturday, the mobile team tries to push an emergency hotfix for the iOS app. They are blocked because the "Zombie Job" from Friday is still sitting in the executor.
>
> **The Solution:** The DevOps team implements a **30-minute Absolute Timeout** on all UI test jobs. If the deadlock happens again, Jenkins kills the job by 6:30 PM, releasing the executor for the mobile team’s emergency fix.

---

## 6. Global Build Time Out: The System-Wide Safety Net

In a large organization with hundreds of teams, it is impossible for a Jenkins Administrator to manually check every job for a timeout. The **Global Build Time Out** feature acts as a universal insurance policy for your server.

### 6.1 Configuration Steps
1. Navigate to **Dashboard** > **Manage Jenkins** > **System**.
2. Scroll down to the **Global Build Time Out** section.
3. Check the box **"Enable Global Build Time Out"**.
4. Set the **Timeout strategy**:
   - **Absolute:** Set a "Kill Switch" for all jobs (e.g., 180 minutes).
   - **Elastic:** Kills any job that takes significantly longer than its own history.
5. Set the **Action**: Usually **Abort** to save resources.

### 6.2 The Hierarchy: Global vs. Local Overrides

A common question is: *"If I have a local timeout and a global timeout, which one wins?"*

- **The Safety Net Logic:** Jenkins evaluates both. If *either* timer runs out, the build is killed.
- **Example:**
  - **Global Limit:** 60 minutes.
  - **Local Job Limit:** 10 minutes.
  - **Result:** The job is killed after **10 minutes** (Local wins because it's stricter).
- **Example 2:**
  - **Global Limit:** 60 minutes.
  - **Local Job Limit:** 120 minutes.
  - **Result:** The job is killed after **60 minutes** (Global wins to protect the server).

> [!IMPORTANT]
> Global timeouts are designed to catch "Runaway" jobs that developers forgot to protect. It prevents a single misconfigured job from hogging an executor for days.

---

## 7. Corporate Scenario: The Morning Shift Disaster

> **The Scenario:** A global retail company runs "Nightly Analytics" builds that usually take 4 hours. One Sunday night, a database update causes the analytics script to enter an infinite loop.
>
> **The Problem:** By 8:00 AM Monday, all 50 executors are still busy running the "stuck" analytics builds from the night before. 500 developers arrive at work and find they cannot run a single build.
>
> **The Solution:** The Administrator had previously set a **Global Build Time Out of 5 hours**. 
>
> **The Result:** Even though the developer forgot to set a timeout on their specific analytics job, the **Global Policy** killed all 50 stuck builds by 1:00 AM. When the developers arrived at 8:00 AM, all executors were free and ready for the morning rush.

---

## 8. Summary Checklist
- **Install:** Ensure "Build Timeout" is in your plugin list.
- **Strategy:** Use "Absolute" for predictability or "No Activity" for silent hangs.
- **Pipeline:** Always include a `timeout()` block in your `options` to protect your executors.
