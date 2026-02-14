# Jenkins Fingerprints: Tracking Artifact Provenance

In a complex CI/CD environment where hundreds of jobs are running, it becomes difficult to track where a specific file came from or where it has been used. **Jenkins Fingerprints** solve this by creating a "digital DNA" for every artifact.

---

## 1. How Fingerprints Work: The MD5 Hash

When you tell Jenkins to "fingerprint" a file, it calculates an **MD5 checksum** of that file. 

-   **Uniqueness:** Even if you rename `Advice_1.jar` to `Latest_Build.jar`, the MD5 remains the same. Jenkins recognizes them as the same physical object.
-   **Database:** Jenkins maintains a database of these hashes inside `$JENKINS_HOME/fingerprints`.
-   **Traceability:** It records which job first created the file (Provenance) and which jobs have since "used" or "copied" it (Usage).

---

## 2. Configuring Fingerprints (Step-by-Step)

To enable tracking for your project:

1.  Navigate to your job configuration (**ASCII-Build-Job**).
2.  Go to the **Post-build Actions** section.
3.  Click **Add post-build action** > **Record fingerprints of files to track usage**.
4.  **Files to fingerprint:** Enter the pattern of files you want to track (e.g., `advice.json`).
5.  *(Optional)* Check **Fingerprint all relevant artifacts** to automate this process.

---

## 3. Industrial Use Cases

### Scenario A: The Dependency Tracker (Upstream/Downstream)
> **The Problem:** You have a "Core Security Library" used by 20 different applications. You find a bug in the library and need to know which apps are running the vulnerable version.
>
> **The Fingerprint Solution:** By looking at the fingerprint of the library version, Jenkins shows you a list of every job that has "Copied" that artifact into its workspace. You instantly have an audit list for patching.

### Scenario B: Evidence for Audits (Compliance)
> **The Problem:** A Production server crashes, and the bank auditor asks: "Which developer and which Git commit produced the exact binary that is currently running on this server?"
>
> **The Fingerprint Solution:** You can upload the binary from the server to the **Check Fingerprint** page in Jenkins. Jenkins will immediately tell you exactly which build number produced that specific binary.

---

## 4. Comparing Artifacts and Fingerprints

| Feature | Artifacts | Fingerprints |
| :--- | :--- | :--- |
| **What is it?** | The actual physical file (`.jar`, `.json`). | The MD5 hash of that file. |
| **Purpose** | To be used in the build/deploy process. | To track usage and provenance. |
| **Storage** | Can be large (GigaBytes). | Very small (a few bytes per hash). |
| **Visibility** | Shown in the Build page. | Shown in the "Check Fingerprint" tool. |

---

## 5. Summary Checklist: Best Practices

-   **Fingerprint Releases:** Always fingerprint artifacts that are bound for Production.
-   **MD5 Integrity:** Do not manually edit the files in the `$JENKINS_HOME/fingerprints` directory.
-   **Copy Artifact Integration:** When using the "Copy Artifact Plugin" (as seen in our earlier demo), always enable fingerprinting in both jobs to maintain the "Chain of Custody."
