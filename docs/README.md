# Syllabus Sync — Documentation Directory

Welcome to the central documentation hub for **Syllabus Sync**. This directory contains all technical, operational, and policy documentation required to understand, deploy, and maintain the platform as an enterprise-grade Campus OS.

## 🏛️ Architecture & System Design

Documents detailing the structural decisions and component interactions that power the platform.

- **[Architecture Overview](./architecture/ARCHITECTURE.md)**: High-level system architecture, Next.js App Router utilization, and the Supabase integration strategy.
- **[Technical Explanation](../TECHNICAL_EXPLANATION.md)**: Deep-dive into edge middleware, Zero-Trust pipelines, state management, and the fused-heading map algorithm.
- **[Route & File Inventory](./inventory/ROUTE_INVENTORY.md)**: A comprehensive map of the Next.js routes, API handlers, and core directory structures.
- **[Navigation Model](./navigation/ROUTES_AND_NAVIGATION.md)**: Reconciles the user-visible navigation (Sidebar, Shells) with the underlying Next.js routing implementation.

## 🔒 Security & Compliance

Documentation proving our secure-by-default posture and adherence to industry best practices.

- **[Security Posture & Hardening Report](./security/SECURITY_POSTURE.md)**: Executive summary, threat models, and our implemented control catalogue.
- **[Security Evidence Index](./security/SECURITY_EVIDENCE_INDEX.md)**: A fast-navigation guide linking specific security controls (WebAuthn, MFA, CSP) directly to their implementation in code.
- **[Privacy Policy](./policies/privacy-policy.md)**: An implementation-aware policy detailing data collection, processing, and user deletion rights.
- **[Security Policy](../SECURITY.md)**: Vulnerability disclosure guidelines and high-level security tenets.

## ⚙️ Operations & Deployment

Runbooks and checklists for managing the application lifecycle across environments.

- **[Environment Setup](./setup/ENVIRONMENT_SETUP.md)**: Prerequisites, local environment configuration, and required third-party services.
- **[Deployment Checklist](./operations/deployment-checklist.md)**: Mandatory quality gates and pre-flight checks required before a production release.
- **[Google Maps Platform Setup](./operations/google-maps-platform-setup.md)**: Runbook for configuring the authenticated Google Maps Embed API and restricting referrer keys.
- **[Email & Cron (Resend + Vercel)](./operations/resend-vercel-setup.md)**: Operational setup for transactional email and scheduled push notification jobs.

## 🔌 API & Integration

Resources for developers interacting with or extending the Syllabus Sync backend.

- **[API Reference](./api/API_REFERENCE.md)**: Documentation of the REST API surface (`app/api/**`), including authentication requirements, rate limiting constraints, and expected payloads.
- **[University Integration Requirements](./university-integration-requirements.md)**: Our technical proposal for integrating Syllabus Sync with official university systems (SSO, Timetables, Canvas/iLearn).

## 🚀 Project Planning & Roadmap

Historical context and future direction for the engineering team.

- **[Improvements Roadmap](../IMPROVEMENTS-ROADMAP.md)**: A categorized, prioritized matrix of planned security, performance, and feature enhancements.
- **[Team Roadmap](./project/team_plan/TEAM_ROADMAP.md)**: Historical tracking of project phases and milestones.
- **[Bug Reports & Post-Mortems](./reports/)**: Detailed analyses of complex system issues (e.g., race conditions in optimistic UI) and their architectural resolutions.
