# SoloDesign — Production Project Inputs

This document defines the high-fidelity structural inputs, scale objectives, compliance patterns, and monetization pipelines for SoloDesign.

## Core Coordinates

| Parameter | Specification |
| :--- | :--- |
| **App Name** | **SoloDesign** |
| **One-Line Value Prop** | **Uncompressed 4K vector brand kits & cinematic logo motion layers instantly.** |
| **Target Users & Roles** | Solo founders, web startups, visual developers, and design leads seeking high-stakes brand synthesis. |
| **Primary User Jobs-to-be-Done** | Synthesize customizable vector logos, extract brand palettes, run accessibility audited contrast checks, animate logo motions, and download brand asset kits as unified dynamic ZIP packages. |
| **Monetization Model** | **Premium tiered subscription memberships** ($19 Trial / $49 Pro / $149 Enterprise) backed by Stripe with secure server-side credit validation and automatic state sync. |
| **Compliance / Regions** | US & EU (GDPR, SOC2, HIPAA, PCI compliant infrastructure standards). |

---

## Technical Specifications & Architecture

### Frontend Configuration
* **Stack**: React 18, Vite, Tailwind CSS, `lucide-react` for graphics.
* **Typings**: Fully typed TypeScript.
* **Layout Paradigm**: Authentic Y2K Neo-Brutalist elements, thick solid #000 borders, high contrast labels, hot cyan/pink highlight offsets.

### Full-Stack Backend Layer
* **Server**: Node.js/Express framework proxied safely through container port `3000`.
* **Runtime**: `tsx` development runner, bundled via `esbuild` for production runtime distributions (`dist/server.cjs`).
* **External APIs**: Secure server-only `@google/genai` connection to avoid browser key leaks.

### Storage & Infrastructure
* **Database**: Cloud Firestore storing authenticated workspace items, configuration models, and user payments.
* **Auth**: Firebase Auth Google Sign-In with real-time token synchronization.

---

## Core Workflows (Top 5)

1. **User Auth & Subscription Synchronization**: Google account login instantly triggers automatic database reconciliation to load credits, plans, and workspace logs.
2. **AI Diffusion Synthesis Pipeline**: Serverproxied Gemini prompts generated based on custom style selections (Minimal, Retro, Metallic, Corporate) delivering high-res logo frames.
3. **Dynamic Palette Customizer**: Users can automatically extract primary and secondary accent combinations from generated frames or input custom hex values.
4. **Interactive WCAG 2.1 Contrast Auditor**: A live relative luminance audit engine compares brand colors against white ground, reporting exact AA/AAA compliance grades.
5. **Unified Vault Bundler (export)**: Pack type scaling, design guidelines, color profiles, asset arrays, and original vectors inside a standalone ZIP deliverable.

---

## Scale & Performance Targets (12 Months)

* **Monthly Active Users (MAU)**: **10,000 MAU**
* **Peak Concurrent Sessions**: **200 concurrent users**
* **Data Growth Vector**: **~50 GB / Month**
* **Reliability Metrics**: **99.9% Uptime SLA**
* **RPO/RTO Limits**: **Recovery Point Objective (RPO) = 15 mins**, **Recovery Time Objective (RTO) = 1 hour**.
