---
name: init-project
description: "Initialize a new project with long-running agent harness infrastructure"
---

# Goal

Set up the **initializer agent infrastructure** for a new project, creating all artifacts needed for effective multi-context-window agent workflows.

## Context

Based on [Anthropic's research on long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents), projects benefit from:
- A structured feature list that prevents premature completion
- A progress file for agent-to-agent handoffs
- An init script for reproducible environment startup
- Git infrastructure for tracking and reverting changes

## Instructions

### 1. Gather Project Information
- Confirm project type and name from user input
- Ask clarifying questions about:
  - Primary language/framework
  - Key features to implement (at least 5-10)
  - Testing approach (unit, integration, e2e)
  - Deployment target (if known)

### 2. Create Feature Registry (`features.json`)
Based on user requirements, generate a comprehensive feature list:

```json
{
  "projectName": "<name>",
  "version": "0.1.0",
  "features": [
    {
      "id": "F001",
      "category": "core|ui|api|testing|infrastructure",
      "priority": 1,
      "description": "Short description of the feature",
      "acceptanceCriteria": [
        "Specific testable criterion 1",
        "Specific testable criterion 2"
      ],
      "passes": false,
      "verifiedAt": null,
      "verifiedBy": null
    }
  ],
  "metadata": {
    "createdAt": "<timestamp>",
    "lastUpdated": "<timestamp>",
    "totalFeatures": 0,
    "passingFeatures": 0
  }
}
```

Generate **at least 20 features** covering:
- Core functionality
- Error handling
- User experience
- Testing infrastructure
- Documentation
- Deployment readiness

### 3. Create Progress File (`agent-progress.md`)

```markdown
# Agent Progress Log

## Project: <name>
## Started: <date>
## Current Status: Initialization

---

## Session Log

### Session 1 - Initialization
**Date**: <date>
**Agent**: Initializer

#### Completed
- Created project structure
- Generated features.json with X features
- Set up init script
- Created initial git commit

#### In Progress
- None

#### Blockers
- None

#### Next Steps
1. Begin implementing F001: <description>
2. Set up development environment
3. Run initial smoke tests

---

## Quick Reference

### Running the Project
\`\`\`bash
./init.sh  # or .\init.ps1 on Windows
\`\`\`

### Current Priority Features
| ID | Description | Status |
|----|-------------|--------|
| F001 | ... | ⏳ |
| F002 | ... | ⏳ |
| F003 | ... | ⏳ |
```

### 4. Create Init Script

**For Unix (`init.sh`)**:
```bash
#!/bin/bash
set -e

echo "🚀 Initializing development environment..."

# Install dependencies
# <package-manager-install-command>

# Start development server (background)
# <dev-server-command> &

# Wait for server to be ready
# sleep 3

# Basic health check
# curl -f http://localhost:3000/health || exit 1

echo "✅ Environment ready!"
```

**For Windows (`init.ps1`)**:
```powershell
$ErrorActionPreference = "Stop"

Write-Host "🚀 Initializing development environment..." -ForegroundColor Cyan

# Install dependencies
# <package-manager-install-command>

# Start development server (background)
# Start-Process -NoNewWindow <dev-server-command>

# Wait for server
# Start-Sleep -Seconds 3

# Basic health check
# Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing

Write-Host "✅ Environment ready!" -ForegroundColor Green
```

### 5. Initialize Git Repository

```bash
git init
git add .
git commit -m "feat: initialize project with agent harness infrastructure

- Created features.json with comprehensive feature list
- Added agent-progress.md for session handoffs
- Set up init scripts for reproducible environment
- Configured for multi-context-window agent workflow"
```

### 6. Create VS Code Settings

Ensure `.vscode/settings.json` includes:
```json
{
  "github.copilot.chat.codeGeneration.useInstructionFiles": true,
  "chat.promptFiles": true
}
```

## Output Format

Provide:
1. **Summary** of created files
2. **Feature count** breakdown by category
3. **Next steps** for the first coding agent session
4. **Commands** to verify setup

## IMPORTANT: Scope Boundary

**STOP after completing the above steps.** This prompt is for scaffolding only.

- ✅ Create `features.json`, `agent-progress.md`, init scripts, git commit
- ✅ Set up basic project structure (package.json, tsconfig, etc.)
- ❌ Do NOT start implementing features from `features.json`
- ❌ Do NOT write application code beyond minimal boilerplate

The user should run `/session-start` to begin implementing features in a separate session.

> **Want to scaffold AND build in one go?** Use `/init-and-build` instead.
