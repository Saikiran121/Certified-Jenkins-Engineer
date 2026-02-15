# Demo: Advanced Notifications with Email Extension (Email-ext)

While the built-in email notification is simple, the **Email Extension (Editable Email)** plugin is the industry standard for professional teams. It supports secure Gmail integration, custom HTML templates, and granular triggers (Success vs. Failure).

---

## 🔐 Step 1: Secure Your Google Account (App Passwords)

Since Google no longer allows "Less Secure Apps," you must use an **App Password**.

1.  Login to your Google Account.
2.  Go to **Manage your Google Account** -> **Security**.
3.  Ensure **2-Step Verification** is ON.
4.  Search for or go to **App passwords**.
5.  Give it a name (e.g., "Jenkins Email") and click **Create**.
6.  **Copy the 16-character secret code** provided. You will need this for Jenkins.

---

## 🔑 Step 2: Store Credentials in Jenkins

1.  Navigate to **Manage Jenkins** -> **Credentials** -> **System** -> **Global credentials (unrestricted)**.
2.  Click **Add Credentials**.
3.  **Kind**: Username with password.
4.  **Username**: Your full Gmail address (e.g., `user@gmail.com`).
5.  **Password**: Paste the **16-character App Password** from Step 1.
6.  **ID**: `gmail-creds` (or any unique name).
7.  **Description**: `Credentials for Gmail SMTP`.
8.  Click **Create**.

---

## ⚙️ Step 3: Global Extended Configuration

1.  Navigate to **Manage Jenkins** -> **System**.
2.  Scroll down to the **Extended E-mail Notification** section.
3.  **SMTP server**: `smtp.gmail.com`
4.  **SMTP Port**: `465` (or `587` for TLS).
5.  Click **Advanced...** -> Check **Use SMTP Authentication**.
6.  Select the **Credentials** you created in Step 2.
7.  Check the box **Use SSL** (required for Port 465).
8.  **Default Recipients**: Add your email address.
9.  **Default Triggers**: Ensure "Failure - Any" and "Success" are enabled.
10. Click **Save**.

---

## 🏗️ Step 4: Configure the Job (Editable Email)

1.  Open your Jenkins job (Freestyle or Pipeline) and click **Configure**.
2.  Go to **Post-build Actions** -> **Add post-build action** -> **Editable Email Notification**.
3.  **Project Recipient List**: Use `$DEFAULT_RECIPIENTS` to use the global list, or add specific ones.
4.  **Content Type**: Select "HTML (text/html)" for fancy layouts.
5.  **Attaching Build Logs**:
    -   To help with debugging, you can attach the actual console log to the email.
    -   Find the **Attach Build Log** dropdown.
    -   Select **Attach Build Log** to include the log as a `.txt` attachment.
6.  **Triggers (Advanced Settings)**:
    -   Inside the "Triggers" section, you can add different behaviors for **Success** and **Failure**.
    -   For each trigger, ensure the **Send To** list includes "Developers" or "Recipient List".
6.  Click **Save**.

---

## 🚀 Step 5: Verification

1.  **Test Failure**: Add an `exit 1` build step and run the job. You will receive an "Editable Email" alert for the failure.
2.  **Test Success**: Remove the `exit 1`, run the job, and you should receive a "Back to Normal" or "Success" notification.

---

## 💡 Key Takeaways
- **Security First**: Never use your primary Google password; always use App Passwords.
- **Granular Control**: Unlike the built-in notification, Email-ext can send different content to different people based on the *state* of the build (e.g., only notify certain managers on Success).
- **Token Support**: Use variables like `$DEFAULT_CONTENT` to keep your project configurations light and centralized.
