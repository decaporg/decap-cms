# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# 3.5.0-beta.0 (2026-09-10)

### Bug Fixes

- don't let a stale trailing refresh mask a successful active-site update ([ea0a9ea](https://github.com/decaporg/decap-cms/commit/ea0a9ea7f6409ed161d75e31377a65ca04c79e23))
- pass site_id as query param so exchange CORS preflight can validate it ([473577b](https://github.com/decaporg/decap-cms/commit/473577beb3f2721e9271d359310e6620ebf6e428))
- refresh stale token before setting active site id in Supabase ([a8534c5](https://github.com/decaporg/decap-cms/commit/a8534c5e933b13e33115ea18085a3412125e02f6))
- **turbo-backends:** refresh session before authenticated requests ([1259a0a](https://github.com/decaporg/decap-cms/commit/1259a0ab0803b19f8e269c8a3c6130a9963d4232))
- **turbo-github,turbo-gitlab:** let config.yml's branch beat the sites row ([c38e1fa](https://github.com/decaporg/decap-cms/commit/c38e1fa36cc2805b7a224a6f2c7cfee28f25a446))
- **turbo-github,turbo-gitlab:** make control-plane repo/branch authoritative over config.yml ([affc358](https://github.com/decaporg/decap-cms/commit/affc3584898c5c36e84f230a2084f4c441710642))
- **turbo-github,turbo-gitlab:** refresh the token before fetching permissions ([e456ac6](https://github.com/decaporg/decap-cms/commit/e456ac6dbf74e9787929513b84a2ca2b70ed48a9))
- **turbo-github,turbo-gitlab:** stop sending an email, and log the branch actually committed to ([28e58fd](https://github.com/decaporg/decap-cms/commit/28e58fd764e02714b72f33163c9f246f59d87e87))
- **turbo-github,turbo-gitlab:** treat a dead refresh token as terminal ([0aba0fc](https://github.com/decaporg/decap-cms/commit/0aba0fc7a145ea92b955ad8366d0d65fdb0799b3))

### Features

- add turbo gitlab backend, rename turbo-github ([ea09b39](https://github.com/decaporg/decap-cms/commit/ea09b3995721227d0eb57c329ad2616d3defd439))
- **backend-turbo:** add save-path metrics to cms_entry_saved event ([476ee34](https://github.com/decaporg/decap-cms/commit/476ee34fa40dbe659ce36e1a0b8c57269c196a40))
- exchange one-time code for tokens instead of reading them from URL ([a5280e8](https://github.com/decaporg/decap-cms/commit/a5280e85dbfa52487699fc9c597abab505973fc5))
- **turbo-github,turbo-gitlab:** add getToken ([c664150](https://github.com/decaporg/decap-cms/commit/c66415095f48be3e721be4e61a8b6b093653d6d9))
- **turbo-github,turbo-gitlab:** enrich cms_entry_saved telemetry ([eb40df6](https://github.com/decaporg/decap-cms/commit/eb40df66a575b121eb15a143a21e7e3ec268b612))
- **turbo-github,turbo-gitlab:** show signed-in user identity and clear session on logout ([295ae6d](https://github.com/decaporg/decap-cms/commit/295ae6dae7989b8006b2579e564dbb1461631ee8))
- **turbo-gitlab:** sync collections server-side, matching turbo-github ([4d9400b](https://github.com/decaporg/decap-cms/commit/4d9400bd5703f36882ce10a9cdfb71e596414ee8))
- **turbo:** surface a deferred sync instead of silently short collections ([7b42f7c](https://github.com/decaporg/decap-cms/commit/7b42f7c6aa7235cb8e74d0b4077e600f7d6b04b4))

### Performance Improvements

- **core,turbo-github,turbo-gitlab:** stop hydrating every draft, cache i18n siblings ([b26cb27](https://github.com/decaporg/decap-cms/commit/b26cb27223714928e06b684527ca233559e8f769))
- **turbo-github,turbo-gitlab,backend-github:** cut redundant and duplicate reads ([133dd26](https://github.com/decaporg/decap-cms/commit/133dd267c28f50a4d324b8a8d2575e76cc8ffefc))
