# Jenkins Security: Authentication vs Authorization

Security in Jenkins is built on a simple but powerful principle: **Know who the user is (Authentication)** and **Know what the user can do (Authorization)**.

---

## 🔑 1. Authentication (Who are you?)

Authentication is the process of verifying a user's identity. Jenkins provides several "Security Realms" to manage this.

### Common Security Realms
- **Jenkins’ own user database**: Users are created and stored directly inside Jenkins. Good for small teams or testing.
- **LDAP / Active Directory**: Connects Jenkins to your corporate directory. Users login with their Windows/Office365 credentials.
- **SAML 2.0 (SSO)**: Integrates with providers like Okta, Azure AD, or Ory for Single Sign-On.
- **Unix user/group database**: Uses the underlying Linux server's user accounts.

### 🏢 Industrial Scenario: AD Integration
**Requirement**: A company with 500 developers wants to avoid creating manual accounts for every new hire.
**Solution**: Configure the **Active Directory Plugin**. 
- **Benefit**: When a developer joins the company and targets the "Engineering" group in AD, they automatically get a Jenkins account with no manual intervention from the Jenkins Admin.

---

## 📜 2. Authorization (What can you do?)

Once a user is authenticated, Authorization determines their level of access. This is governed by an **Authorization Strategy**.

### Popular Authorization Strategies
- **Logged-in users can do anything**: Very common in small labs, but dangerous for production.
- **Matrix-based security**: A giant "Excel-like" table where you check specific boxes (Read, Build, Delete) for specific users or groups.
- **Role-Based Strategy (RBAC)**: The gold standard for enterprise. You define **Roles** (e.g., "Developer", "Admin", "Reviewer") and then assign users to those roles.

### 🏢 Industrial Scenario: RBAC for Multiple Teams
**Requirement**: Team "Alpha" should not be able to see or trigger Team "Beta's" builds.
**Solution**: Use **Project-based Matrix Security** or **Role-Based Strategy** with **Regex patterns**.
- **Implementation**:
    - Create a Role: `Alpha-Dev` with a pattern `Alpha-.*`.
    - Create a Role: `Beta-Dev` with a pattern `Beta-.*`.
    - Result: Users in `Alpha-Dev` can only see jobs starting with the name "Alpha-", ensuring complete isolation between teams.

---

## 🛡️ 3. Security Best Practices

### The "Nobody" User
Disable high-level permissions for the `Anonymous` user. In a professional setup, an unauthenticated user should not even be able to see the job names.

### CSRF Protection
Always enable **Prevent Cross Site Request Forgery exploits**. This adds a "Security Crumb" requirement to all API requests, preventing malicious websites from triggering builds in your browser session.

### Agent to Controller Security
Ensure **Agent -> Controller Security** is enabled. This prevents a compromised build agent from sending malicious commands back to the main Jenkins controller to steal credentials or secrets.

---

## 💡 Key Takeaways
- **Authentication**: LDAP/AD is for "Identity".
- **Authorization**: RBAC is for "Permissions".
- **Separation of Duties**: Never give "Configure" permissions to everyone; only Senior DevOps/SREs should change job logic.
