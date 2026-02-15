# Demo: Configuring Built-in Email Notifications

Jenkins can automatically alert developers when a build fails. This demo covers the "Built-in" email capability, which is standard in any Jenkins installation.

---

## 🛠️ Step 1: Global SMTP Configuration (Prerequisite)

Before a specific job can send emails, the Jenkins Admin must configure the global mailing server (SMTP).

1.  Navigate to **Manage Jenkins** -> **System**.
2.  Scroll down to the **E-mail Notification** section.
3.  Enter your **SMTP Server** (e.g., `smtp.gmail.com` or your corporate relay).
4.  Click **Advanced...** to set your username and password if authentication is required.
5.  Check the box **Test configuration by sending test e-mail** to ensure Jenkins can reach the internet.

---

## 🏗️ Step 2: Configure the Freestyle Project

1.  Open your existing Freestyle project (e.g., "My-First-Project").
2.  Click **Configure** in the sidebar.
3.  Scroll down to the **Post-build Actions** section.
4.  Click **Add post-build action** and select **E-mail Notification**.

---

## 📧 Step 3: Add Recipients

1.  In the **Recipients** field, enter the email addresses you want to notify (separated by whitespace).
2.  Check the box **Send e-mail for every unstable build**.
3.  Check the box **Send separate e-mails to individuals who broke the build** (This uses Git data to find the committer).

---

## 💣 Step 4: Simulate a Build Failure

To verify that the email logic works, we need to force the build to fail.

1.  Go to the **Build Steps** section of your project.
2.  Click **Add build step** -> **Execute shell**.
3.  Enter the following command:
    ```bash
    echo "Simulating a critical failure..."
    exit 1
    ```
4.  Click **Save**.

---

## 🚀 Step 5: Verification

1.  Click **Build Now**.
2.  The build status will turn **RED** (Failed).
3.  Open the **Console Output** of the build.
4.  At the very bottom, you should see a log entry:
    ```text
    Sending e-mails to: saikiran@example.com
    Finished: FAILURE
    ```
5.  Check your inbox for the notification!

---

## 💡 Key Takeaways
- **Built-in vs. Email-ext**: The standard "E-mail Notification" is simple and effective. For complex HTML templates or triggering on "Back to Normal" events, the **Email-ext** plugin is recommended.
- **Fail-Fast**: Email notifications ensure that developers are alerted immediately when they break the master branch, reducing the time a repository stays in a broken state.
