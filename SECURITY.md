# Security Policy

Decap CMS takes security seriously. This document outlines our security policy, supported versions, and how to report security vulnerabilities.

## Supported Versions

Security updates are provided for:

| Version | Status | Lifecycle |
|---------|--------|-----------|
| 3.x | ✅ Actively Supported | Current stable release |
| 2.x (Netlify CMS) | ❌ Unsupported | Legacy - no updates |
| 1.x (Netlify CMS) | ❌ Unsupported | Legacy - no updates |

**Note:** Decap CMS was renamed from Netlify CMS in February 2023. Versions 1.x and 2.x are no longer maintained. We recommend upgrading to version 3.x for security updates and new features.

## Reporting a Vulnerability

If you discover a security vulnerability in Decap CMS, please report it **confidentially** through our dedicated reporting process.

**Submit your report at:** https://decapcms.org/report-vulnerability

Please include the following information:

- **Vulnerability Title**: Brief summary of the issue
- **Description**: Detailed explanation of the vulnerability
- **Affected Version(s)**: Which version(s) of Decap CMS are affected
- **Steps to Reproduce**: Clear steps to demonstrate the vulnerability (if applicable)
- **Impact Assessment**: Potential impact on users (e.g., data exposure, unauthorized access, content integrity)
- **Your Name**: For attribution and follow-up communication
- **Your Email**: Primary contact method
- **Publish Credit**: Would you like to be credited publicly when this is disclosed?

### What NOT to Do

- Do not open a public GitHub issue for the vulnerability
- Do not post details on social media or public forums
- Do not attempt to exploit the vulnerability beyond confirming it exists
- Do not access data beyond what's necessary to demonstrate the issue

## Response Timeline

This project follows a 90-day disclosure timeline.

## Coordinated Disclosure

We follow responsible disclosure practices:

1. You submit a vulnerability report via our form
2. Our security team acknowledges receipt
3. We investigate and determine severity and scope
4. We develop a fix and prepare a security release
5. We notify you of resolution and next steps
6. We release the security update to users
7. We publish a security advisory (with your attribution, if approved)

## Security Practices


- Dependabot is enabled for automated security update checks
- All code changes are tested in CI including linting
- End-to-end tests provide coverage of critical functionality
- All pull requests require code review before merging
- Passwords are not stored by Decap CMS; authentication is delegated to providers

## Known Limitations

- This is a **community-maintained open-source project**, not a commercial product with dedicated security resources
- Security depends on the stability and practices of underlying dependencies and backend providers
- Some vulnerabilities in dependencies may not be immediately patchable if they break backwards compatibility
- This is a project with a long history and many legacy dependencies can't be updated without significant refactoring
