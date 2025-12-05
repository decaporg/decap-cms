# [Decap CMS](https://decapcms.org) 📝

![Decap CMS Logo](/img/decap.svg)

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?style=for-the-badge)](https://github.com/sponsors/decaporg)
[![Open Collective](https://img.shields.io/badge/Sponsor-Open%20Collective-blue?style=for-the-badge)](https://opencollective.com/decap)

---

> **Decap CMS** is an open-source content management system (CMS) built for static site generators.  
> It provides a simple, user-friendly way to manage and edit content stored in a Git repository — directly from your site’s `/admin` panel.

_Formerly known as **Netlify CMS**, Decap CMS was renamed in [February 2023](https://www.netlify.com/blog/netlify-cms-is-now-decap-cms/)._

Join our community chat on **[Discord](https://decapcms.org/chat)** 💬

---

## 🚀 How It Works

Decap CMS is a single-page React application that you place under the `/admin` path of your static site.

It provides a clean UI for editing content stored in your Git repository.

- You configure the CMS using a YAML file (`config.yml`) that defines your site’s content model.
- You can customize the layout and behavior to suit your project.
- When users visit `/admin/`, they log in and edit or create content directly through the CMS interface.
- All changes are committed to your repository.

📖 Learn more in the [Core Concepts documentation](https://decapcms.org/docs/intro/).

---

## ⚙️ Installation and Configuration

Decap CMS can be used in **two main ways**:

### 1. Quick Start (Recommended)
A fast setup method that only requires an HTML file and a simple configuration.

👉 See the [Quick Start Guide](https://decapcms.org/docs/quick-start/).

### 2. Advanced Setup
For full flexibility, integrate Decap CMS into your build or deploy workflow.  
This setup is ideal for large projects and supports custom widgets, backends, and authentication.

👉 Learn more in the [Advanced Configuration Guide](https://decapcms.org/docs/add-to-your-site/).

---

## 🧰 Local Development (Optional)

If you want to contribute or test Decap CMS locally:

```bash
# Clone your fork
git clone https://github.com/<your-username>/decap-cms.git
cd decap-cms

# Install dependencies
npm install

# Start the development environment
npm start
