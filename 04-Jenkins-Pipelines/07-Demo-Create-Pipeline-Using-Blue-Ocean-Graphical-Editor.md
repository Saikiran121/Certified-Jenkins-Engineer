# Demo: Creating a Pipeline with Blue Ocean Graphical Editor

Blue Ocean is a modern, visual user interface for Jenkins that makes it easier to create and visualize complex pipelines. This demo walks through how to use the Graphical Editor to connect a GitHub repository.

---

## 🛠️ Step 1: Install the Blue Ocean Plugin

Before you can use the graphical editor, you must ensure the plugin is installed.

1.  Navigate to **Manage Jenkins** -> **Plugins**.
2.  Click on the **Available plugins** tab.
3.  Search for **"Blue Ocean"**.
4.  Select the **Blue Ocean** plugin (it usually includes several sub-plugins).
5.  Click **Install without restart** (or download and install after restart).

---

## 🌊 Step 2: Launch Blue Ocean

Once installed, you can access the new UI:

1.  Go to your Jenkins Dashboard.
2.  In the left sidebar, click on **Open Blue Ocean**.
3.  You are now in the modern Jenkins interface.

---

## 🚀 Step 3: Create a New Pipeline via the Graphical Editor

This is the fastest path to connecting your GitHub repository to Jenkins.

### 1. Start the Creation Flow
1.  In the Blue Ocean dashboard, click the **New Pipeline** button.
2.  Select **GitHub** as your source control provider.

### 2. Authentication with GitHub (Personal Access Token)
1.  Jenkins will ask for an **Access Token**.
2.  Click the link provided by Jenkins to create a token in GitHub, or go to GitHub -> **Settings** -> **Developer settings** -> **Personal access tokens** -> **Tokens (classic)**.
3.  Ensure the token has `repo` and `user:email` permissions.
4.  Copy the token and paste it back into the Jenkins Blue Ocean UI.
5.  Click **Connect**.

### 3. Select Your Repository
1.  Select your GitHub **organization** or **profile** (e.g., `Saikiran121`).
2.  Find and select your repository (e.g., `Certified-Jenkins-Engineer`).
3.  Click **Create Pipeline**.

---

## 🎨 Step 4: Using the Visual Editor

If your repository doesn't have a `Jenkinsfile` yet, Blue Ocean will open the **Graphical Pipeline Editor**:

-   **Stages**: Click the **+** icon to add new parallel or sequential stages.
-   **Steps**: Use the menu on the right to add steps like `sh`, `echo`, `junit`, or `archiveArtifacts`.
-   **Saving**: When you click **Save**, Blue Ocean will automatically commit a `Jenkinsfile` to your GitHub repository for you.

---

## 💡 Key Takeaways
- **Visual Feedback**: Blue Ocean provides a clear, color-coded map of your pipeline stages.
- **GitOps Friendly**: The editor writes the code for you, ensuring your build logic always stays in sync with your source code.
- **Modern Experience**: It simplifies the complexity of GitHub authentication and SCM configuration.
