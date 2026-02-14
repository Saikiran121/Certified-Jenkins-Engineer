# Demo: Chaining Freestyle Projects (Upstream & Downstream)

In a professional Jenkins environment, we rarely put everything into a single massive job. Instead, we break tasks into **modular components** that are chained together. This makes it easier to identify points of failure and re-run only the specific parts that failed.

In this demo, we will split our ASCII Artwork workflow into three separate projects.

---

## 1. The Strategy: Modular Breakdown

We will create three projects:
1.  **`Step-1-Fetch`**: Downloads the advice.
2.  **`Step-2-Validate`**: Checks if the advice is worth showing.
3.  **`Step-3-Render`**: Creates the ASCII cow.

---

## 2. Configuration Steps

### Job 1: `ASCII-Build-Job` (Upstream)
- **General Settings:**
  - Check **Permission to Copy Artifact**.
  - **Projects to allow copy artifacts:** `ASCII-Test-Job` (This grants the downstream job permission to access these files).
- **Build Step (Execute shell):**
  ```bash
  # Fetch advice
  curl -s https://api.adviceslip.com/advice > advice.json
  cat advice.json
  
  # Extract advice
  jq -r '.slip.advice' advice.json > advice.message
  ```
- **Post-build Actions:** 
  1. Select **Archive the artifacts**. 
     - **Files to archive:** `advice.json, advice.message`.
  2. Select **Build other projects**. 
     - **Project to build:** `ASCII-Test-Job`.

---

### Job 2: `ASCII-Test-Job` (Downstream)
- **Build Triggers:** Check **Build after other projects are built**. (Upstream project: `ASCII-Build-Job`).
- **Build Steps:**
  1. **Copy artifacts from another project:**
     - **Project name:** `ASCII-Build-Job`
     - **Which build:** `Latest successful build`
     - **Artifacts to copy:** `advice.json, advice.message`
  2. **Execute shell:**
     ```bash
     # Validate word count
     if [ "$(wc -w < advice.message)" -gt 5 ]; then
       echo "Advice has more than 5 words"
     else
       echo "Advice - $(cat advice.message) - has 5 or fewer words"
       exit 1
     fi
     ```
- **Post-build Actions:**
  1. Select **Archive the artifacts**. (Add `advice.message`).
  2. Select **Build other projects**. (Add `ASCII-Render-Job`).

---

### Job 3: `ASCII-Render-Job` (Downstream)
- **Build Triggers:** Check **Build after other projects are built**. (Upstream project: `ASCII-Test-Job`).
- **Build Steps:**
  1. **Copy artifacts from another project:**
     - **Project name:** `ASCII-Test-Job`
     - **Artifacts to copy:** `advice.message`
  2. **Execute shell:**
     ```bash
     # Generate ASCII art
     /usr/games/cowsay -f "$(ls /usr/share/cowsay/cows | shuf -n 1)" "$(cat advice.message)"
     ```

---

## 3. The "Gotcha": Data Sharing Between Jobs

> [!IMPORTANT]
> **Every Jenkins job has its own unique Workspace folder.**
> If `Step-1-Fetch` creates `advice.message`, that file lives in `/var/lib/jenkins/workspace/Step-1-Fetch`. 
> 
> When `Step-2-Validate` starts, it looks in `/var/lib/jenkins/workspace/Step-2-Validate`, which is **EMPTY**. It will fail because it cannot find the file.

### How to share data in Chained Jobs:
1.  **Archiving Artifacts:** Use the "Archive the artifacts" post-build action in the upstream job.
2.  **Copy Artifact Plugin:** In the downstream job, use a build step called **Copy artifacts from another project** to pull the files from the upstream project into the current workspace.

---

## 4. Why Chain Projects?

1.  **Visibility:** In the dashboard, you can see exactly which stage failed (Fetching? Validating? Rendering?).
2.  **Parallelism:** You can have one upstream job trigger multiple downstream jobs that run at the same time.
3.  **Security:** You can give developers access to "Build" jobs but restrict "Deploy" jobs to Admins, even if they are part of the same chain.
4.  **Reusability:** A "Security Scan" job could be an upstream trigger for 50 different build projects.

---

## 5. Summary Checklist
- **Upstream:** The project that triggers another.
- **Downstream:** The project that is triggered.
- **Data Sharing:** Files do **not** automatically follow the chain; they must be archived and copied.
