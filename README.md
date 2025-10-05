# 🐼 triage-panda – AI-Powered GitHub Issue Triage Agent 🤖

An autonomous AI agent 🐼 built with **NestJS** and **LangGraph** to automatically triage and manage GitHub issues. This project leverages the power of Large Language Models (LLMs) to understand, categorize, prioritize, and comment on new issues, streamlining the workflow for development teams.

## ✨ Core Features

This agent uses a stateful, cyclical workflow to perform its tasks. When a new issue is created in a configured repository, the agent will:

1.  **Webhook Trigger:** Automatically activate when a new issue is created via a GitHub webhook.
2.  **Multi-Step Tool Use:**
    - First, it fetches the issue content using the `get_github_issue_by_number` tool.
    - It analyzes this content to decide on appropriate labels and a summary comment.
    - Finally, it uses the `add_github_labels` and `post_github_comment` tools to apply its analysis back to GitHub.
3.  **AI-Powered Decisions:** Uses Google's Gemini model to reason about the issue and decide which tools to use at each step.
4.  **Full Observability:** Integrated with Langfuse to provide detailed, step-by-step tracing of the agent's entire thought process.

---

## 🛠️ Tech Stack

- **Backend Framework:** [NestJS](https://nestjs.com/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **AI Orchestration:** [LangChain.js](https://js.langchain.com/) & [LangGraph](https://js.langchain.com/docs/langgraph/)
- **LLM Provider:** [Google Gemini](https://ai.google.dev/)
- **Observability:** [Langfuse](https://langfuse.com/) (Self-Hosted)

---

## 📈 Workflow: The Agent Loop

The agent's logic is modeled as a stateful graph that allows it to think, act, and observe in a loop until its goal is complete.

```
                   START
                     │
                     ▼
            ┌─────────────────┐
            │   Agent (LLM)   │
            │     (Think)     │
            └─────────────────┘
                      │
                      ▼ (Decides Action)
        ┌─────────────┴──────────────┐
        │                            │
        ▼ (Tool Call)                ▼ (No More Tools)
    ┌───────────┐                    (END)
    │ Tool Node │
    │  (Act)    │
    └───────────┘
        │
        └────────────────────────────> (Observe Result)
```
---

## 🚀 Prerequisites

Before running this application, you need to configure a GitHub App, ngrok, and a local Langfuse instance.

### 1. GitHub App Setup

This agent interacts with GitHub via a GitHub App, which provides a secure way to handle authentication and permissions.

1.  **Navigate to GitHub Apps:** Go to your GitHub **Settings** > **Developer settings** > **GitHub Apps** and click **New GitHub App**.

2.  **Register the App:**
    - **App name:** Choose a name (e.g., `triage-panda`).
    - **Homepage URL:** Use your GitHub profile or repository URL.
    - **Webhook:**
      - Check the **Active** box.
      - **Webhook URL:** Use a placeholder for now, like `https://example.com`. (update it later)
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
    - **Installation ID:** After installing the app, click "Configure". The ID is the number at the end of the URL (e.g., `.../installations/1234567`).
    - **Private Key:** The content of the `.pem` file you downloaded.

### 2. ngrok Setup

`ngrok` exposes your local server to the internet to receive GitHub webhooks.

1.  **Create a Free Account:** Sign up at [https://dashboard.ngrok.com/signup](https://dashboard.ngrok.com/signup).
2.  **Install Your Authtoken:** Follow the instructions on your ngrok dashboard. **It's a one-time command** you run on your machine:
    ```bash
    npx ngrok config add-authtoken <YOUR_AUTHTOKEN>
    ```

### 3. Langfuse Setup (Local Docker)

We'll run Langfuse locally using Docker to trace our agent's behavior.

1.  **Prerequisite:** Ensure you have **Docker** and **Docker Compose** installed.
2.  **Clone Langfuse:**
    ```bash
    git clone [https://github.com/langfuse/langfuse.git](https://github.com/langfuse/langfuse.git)
    ```
3.  **Run Langfuse:**
    ```bash
    cd langfuse
    docker compose up -d
    ```
4.  **Access the UI:** Open [http://localhost:3000](http://localhost:3000) in your browser. Sign up for a local account, create a new project, and navigate to **Project Settings > API Keys** to get your local keys.

---

## ⚙️ Local Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd triage-panda
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create and configure your `.env.development` file:**
    go to the file named `./backend/src/config/.env.development` and update it with the credentials you gathered.

    ```env
    # GitHub App Credentials
    GITHUB_APP_ID="YOUR_APP_ID_HERE"
    GITHUB_INSTALLATION_ID="YOUR_INSTALLATION_ID_HERE"
    GITHUB_WEBHOOK_SECRET="your_strong_webhook_secret_here"
    GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIC...your key...\n-----END RSA PRIVATE KEY-----"

    # Google Gemini API Key
    GOOGLE_API_KEY="your_google_api_key_here"
    
    # Langfuse Credentials (for local Docker instance)
    LANGFUSE_PUBLIC_KEY="pk-lf-..." # Your LOCAL public key
    LANGFUSE_SECRET_KEY="sk-lf-..." # Your LOCAL secret key
    LANGFUSE_HOST="http://localhost:3000"
    ```

---

## 🚀 Running the Application

1.  **Start Langfuse:**
    Make sure your Langfuse Docker containers are running. If not, navigate to the `langfuse` directory and run:
    ```bash
    docker compose up -d
    ```

2.  **Start the NestJS Server:**
    ```bash
    cd backend
    npm run start:dev
    ```

3.  **Start ngrok:**
    In a **new terminal window**, expose your local port (default is 3000):

    ```bash
    cd backend
    npx ngrok config add-authtoken <YOUR_AUTHTOKEN>
    npx ngrok http 3000
    ```

    Copy the `https` forwarding URL provided by ngrok.

4.  **Update the Webhook URL:**
    - Go back to your GitHub App's "General" settings.
    - In the "Webhook URL" field, paste your `ngrok` forwarding URL and append `/webhooks/github` to it.
    - **Example:** `https://random-string.ngrok-free.app/webhooks/github`
    - Click **Save changes**.

---

## ✅ Testing the Workflow

Your application is now live. To test it, go to the repository where you installed the GitHub App and create a new issue.

-   Check your running NestJS application's console logs to see the agent's activity.
-   Open your local Langfuse dashboard at [http://localhost:3000](http://localhost:3000) to see a detailed, step-by-step trace of the agent's entire thought process.

## 🔮 Future Roadmap

This project is designed to be extensible. Future enhancements will include:


- **Clarification Loops:** Enable the agent to ask for more information on vague issues.
- **Self-Correction:** Add logic to handle tool failures or unexpected outcomes gracefully.
- **Code Owner Suggestion:** Analyze issue content to suggest the best team member for the assignment.