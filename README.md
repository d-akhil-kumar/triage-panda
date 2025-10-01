# 🐼 triage-panda – AI-Powered GitHub Issue Triage Agent 🤖

An autonomous AI agent 🐼 built with **NestJS** and **LangGraph** to automatically triage and manage GitHub issues. This project leverages the power of Large Language Models (LLMs) to understand, categorize, prioritize, and comment on new issues, streamlining the workflow for development teams.

## ✨ Core Features (Happy Path)

This initial version of the agent focuses on the primary "happy path" workflow. When a new issue is created in a configured repository, the agent will:

1.  **Webhook Trigger:** Automatically activate when a new issue is created via a GitHub webhook.
2.  **Fetch & Analyze:** Read the new issue's title and body content.
3.  **AI-Powered Categorization:** Use an LLM to analyze the content and determine appropriate **labels** (e.g., `bug`, `feature_request`, `documentation`) and a **priority level** (e.g., `P0-Critical`, `P1-High`, `P2-Medium`).
4.  **Automated Commenting:** Post a comment back to the issue summarizing its analysis, making the triage process transparent.
5.  **Apply Labels:** Automatically apply the determined labels directly to the GitHub issue.

---

## 🛠️ Tech Stack

- **Backend Framework:** [NestJS](https://nestjs.com/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **AI Orchestration:** [LangChain.js](https://js.langchain.com/) & [LangGraph](https://js.langchain.com/docs/langgraph/)
- **LLM Provider:** (e.g., OpenAI, Google Gemini, Anthropic)
- **Database:** MySQL (for future stateful operations)

---

## 📈 Workflow

The agent's logic is modeled as a stateful graph, ensuring a robust and extensible workflow.

```
                GitHub Webhook (Issue Opened)
                            │
                            ▼
                ┌────────────────────┐
                │  Fetch Issue Node  │
                └────────────────────┘
                            │
                            ▼
                ┌─────────────────────┐
                │  Analyze Issue Node │ (LLM Call)
                └─────────────────────┘
                            │
                            ▼
                ┌──────────────────────┐
                │  Update GitHub Node  │ (Post Comment & Add Labels)
                └──────────────────────┘
                            │
                            ▼
                          (END)
```

---

## 🚀 Prerequisites

Before running this application, you need to configure a GitHub App and ngrok to handle webhooks.

### 1. GitHub App Setup

This agent interacts with GitHub via a GitHub App, which provides a secure way to handle authentication and permissions.

1.  **Navigate to GitHub Apps:** Go to your GitHub **Settings** > **Developer settings** > **GitHub Apps** and click **New GitHub App**.

2.  **Register the App:**

    - **App name:** Choose a name (e.g., `triage-panda`).
    - **Homepage URL:** Use your GitHub profile or repository URL.
    - **Webhook:**
      - Check the **Active** box.
      - **Webhook URL:** Use a placeholder for now, like `https://example.com`. We will update this later.
      - **Webhook secret:** Generate a strong, random password and save it for your `.env` file.

3.  **Set Permissions & Events:**

    - Click on the **"Permissions & events"** tab in the sidebar.
    - **Repository Permissions:** Scroll to `Issues` and select **Read & write** from the dropdown.
    - **Subscribe to events:** Scroll down and check the box for **Issues**.
    - Provide a reason for the changes at the top of the page (e.g., "To read issues and post triage comments") and click **Save changes**.

4.  **Generate Private Key:**

    - Go back to the **"General"** tab.
    - Scroll down to the "Private keys" section and click **Generate a private key**.
    - A `.pem` file will be downloaded. **Store this file securely.**

5.  **Install the App:**

    - Go to the **"Install App"** tab and install the app in the repository you want it to manage.

6.  **Gather Your Credentials:**
    - **App ID:** Find this on the app's "General" settings page.
    - **Installation ID:** After installing the app, click "Configure" next to the repository. The ID is the number at the end of the URL (e.g., `.../installations/1234567`).
    - **Private Key:** The content of the `.pem` file you downloaded.

### 2. ngrok Setup

`ngrok` exposes your local server to the internet so it can receive GitHub webhooks.

1.  **Create a Free Account:** Sign up at [https://dashboard.ngrok.com/signup](https://dashboard.ngrok.com/signup).
2.  **Install Your Authtoken:** Follow the instructions on your ngrok dashboard to add your authtoken to your machine. **It's a one-time command**, copy the below cmd for below steps:
    ```bash
    npx ngrok config add-authtoken <YOUR_AUTHTOKEN>
    ```

---

## ⚙️ Local Setup

1.  **Clone the repository:**

    ```bash
    git clone <your-repo-url>
    cd triage-panda
    cd backend
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Create and configure your `.env.development` file:**
    go to the file named `./backend/src/config/.env.development` and update it with the credentials you gathered above.

    ```env
    # GitHub App Credentials
    GITHUB_APP_ID="YOUR_APP_ID_HERE"
    GITHUB_INSTALLATION_ID="YOUR_INSTALLATION_ID_HERE"
    GITHUB_WEBHOOK_SECRET="your_strong_webhook_secret_here"

    # Your multi-line RSA Private Key, formatted as a single line with \n
    GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIC...your key content...\n-----END RSA PRIVATE KEY-----"

    ```

---

## 🚀 Running the Application

1.  **Start the NestJS Server:**

    ```bash
    cd backend
    npm run start:dev
    ```


2.  **Start ngrok:**
    In a **new terminal window**, expose your local port (default is 3000):

    ```bash
    cd backend
    npx ngrok config add-authtoken <YOUR_AUTHTOKEN>
    npx ngrok http 3000
    ```

    Copy the `https` forwarding URL provided by ngrok.

3.  **Update the Webhook URL:**
    - Go back to your GitHub App's "General" settings.
    - In the "Webhook URL" field, paste your `ngrok` forwarding URL and append `/webhooks/github` to it.
    - **Example:** `https://random-string.ngrok-free.app/webhooks/github`
    - Click **Save changes**.

---

## ✅ Testing the Workflow

Your application is now live. To test it, go to the repository where you installed the GitHub App and create a new issue. Check your running NestJS application's console logs to see the agent spring into action!

## 🔮 Future Roadmap

This project is designed to be extensible. Future enhancements will include:

- **Installation guide:** How to clone and run the project in local systems.
- **Clarification Loops:** Enabling the agent to ask for more information on vague issues.
- **Self-Correction:** Adding logic to handle tool failures or unexpected outcomes gracefully.
- **Code Owner Suggestion:** Analyzing issue content to suggest the best team member for the assignment.
