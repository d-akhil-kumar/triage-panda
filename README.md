
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

* **Backend Framework:** [NestJS](https://nestjs.com/)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **AI Orchestration:** [LangChain.js](https://js.langchain.com/) & [LangGraph](https://js.langchain.com/docs/langgraph/)
* **LLM Provider:** (e.g., OpenAI, Google Gemini, Anthropic)
* **Database:** MySQL (for future stateful operations)

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

## 🚀 Getting Started

### Prerequisites

* Node.js (v18 or higher)
* npm or yarn
* A GitHub account and a repository for testing
* API keys for your chosen LLM provider

### Installation (Just a placeholder for now)

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd <your-repo-name>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root directory and add the following variables:
    ```env
    # GitHub App or Personal Access Token
    GITHUB_TOKEN=your_github_token

    # Secret used to secure your webhook
    GITHUB_WEBHOOK_SECRET=your_webhook_secret

    # Your chosen LLM provider's API key
    OPENAI_API_KEY=your_llm_api_key
    ```

4.  **Run the application:**
    ```bash
    npm run start:dev
    ```
    The application will be running on `http://localhost:3000`. You will need to expose this endpoint to the public internet (using a tool like `ngrok`) to receive GitHub webhooks.

---

## 🔮 Future Roadmap

This project is designed to be extensible. Future enhancements will include:


* **Installation guide:** How to clone and run the project in local systems.
* **Clarification Loops:** Enabling the agent to ask for more information on vague issues.
* **Self-Correction:** Adding logic to handle tool failures or unexpected outcomes gracefully.
* **Code Owner Suggestion:** Analyzing issue content to suggest the best team member for the assignment.
