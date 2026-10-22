/**
 * The Decap Turbo API contract: one definition per operation, shared by the
 * Turbo server's `/api/v1` routes (input validation), the `decap` CLI
 * (commands and flags) and the CLI's MCP server (tool names, descriptions,
 * input schemas).
 *
 * Published on its own so the Turbo server, a separate private repository,
 * can pin the exact contract a CLI release was built against. An API change
 * lands here first; the server then bumps its pin.
 *
 * Deliberately dependency-free. Input schemas are plain JSON Schema objects —
 * the format MCP wants anyway — checked by the small validator at the bottom
 * of this file, which covers the flat request bodies the API takes.
 */

export type Scope = 'editor' | 'admin';

export type JsonSchemaProperty =
  | {
      type: 'string';
      description?: string;
      enum?: readonly string[];
      pattern?: string;
      minLength?: number;
      maxLength?: number;
    }
  | { type: 'integer' | 'number'; description?: string; minimum?: number; maximum?: number }
  | { type: 'boolean'; description?: string }
  /** A free-form JSON object, e.g. field values keyed by field path. */
  | { type: 'object'; description?: string; additionalProperties: true };

export interface JsonSchemaObject {
  type: 'object';
  properties: Record<string, JsonSchemaProperty>;
  required?: readonly string[];
  additionalProperties: false;
}

export interface Operation {
  id: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  /**
   * Path under /api/v1. `{name}` segments are filled from the input field of
   * the same name, which must be declared in `input`; see `buildRequest`.
   */
  path: string;
  summary: string;
  /** How the caller authenticates. `none` is only for the login code exchange. */
  auth: 'token' | 'none';
  /** Minimum token scope. Absent for `auth: 'none'`. */
  scope?: Scope;
  input: JsonSchemaObject;
  /** Exposed as an MCP tool when present. */
  mcp?: { name: string; title: string; readOnly: boolean; destructive?: boolean };
  /**
   * Exposed as a `decap` command when present, e.g. `['sites', 'list']`.
   * Input fields become flags: `org_id` → `--org`, `config_path` →
   * `--config-path` (see `flagName`).
   */
  cli?: { command: readonly string[]; columns?: readonly string[] };
}

const NO_INPUT: JsonSchemaObject = { type: 'object', properties: {}, additionalProperties: false };

const UUID = '^[0-9a-fA-F-]{36}$';
const orgId = {
  type: 'string',
  pattern: UUID,
  description: 'Organization id (see list_orgs)',
} as const;
const siteId = { type: 'string', pattern: UUID, description: 'Site id (see list_sites)' } as const;
const member = {
  type: 'string',
  minLength: 3,
  maxLength: 320,
  description: 'The member, by user id or email address',
} as const;
const siteFields = {
  name: { type: 'string', minLength: 1, maxLength: 200, description: 'Display name' },
  provider: {
    type: 'string',
    enum: ['github', 'gitlab'],
    description: 'Git provider, default github',
  },
  repo: {
    type: 'string',
    maxLength: 300,
    description:
      'owner/name on GitHub, group/project on GitLab. The org must have that provider connected.',
  },
  branch: { type: 'string', maxLength: 250, description: 'Branch the CMS edits, default main' },
  config_path: {
    type: 'string',
    maxLength: 500,
    description: 'Path to config.yml in the repo, default admin/config.yml',
  },
  admin_interface_url: {
    type: 'string',
    maxLength: 2000,
    description:
      'Where the CMS admin is served, e.g. https://example.com/admin/. Several patterns separated by commas or newlines; * wildcards allowed in the host.',
  },
} as const;

export const operations = {
  me: {
    id: 'me',
    method: 'GET',
    path: '/me',
    summary:
      'Who the caller is: the Turbo user behind the token, the token itself, and the organizations they belong to with their role in each.',
    auth: 'token',
    scope: 'editor',
    input: NO_INPUT,
    mcp: { name: 'whoami', title: 'Who am I in Decap Turbo', readOnly: true },
  },
  cliToken: {
    id: 'cliToken',
    method: 'POST',
    path: '/cli/token',
    summary:
      'Trade the one-time code from `decap login` and its PKCE verifier for a personal access token.',
    auth: 'none',
    input: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          pattern: '^[A-Za-z0-9_-]{43}$',
          description: 'Code delivered to the loopback callback',
        },
        code_verifier: {
          type: 'string',
          pattern: '^[A-Za-z0-9._~-]{43,128}$',
          description: 'PKCE verifier whose S256 challenge was sent to /cli/authorize',
        },
      },
      required: ['code', 'code_verifier'],
      additionalProperties: false,
    },
  },
  revokeCurrentToken: {
    id: 'revokeCurrentToken',
    method: 'POST',
    path: '/cli/logout',
    summary: 'Revoke the token making this request. Used by `decap logout`.',
    auth: 'token',
    scope: 'editor',
    input: NO_INPUT,
  },

  // --- Organizations -------------------------------------------------------

  listOrgs: {
    id: 'listOrgs',
    method: 'GET',
    path: '/orgs',
    summary: 'The organizations the caller belongs to, with their role and plan in each.',
    auth: 'token',
    scope: 'editor',
    input: NO_INPUT,
    mcp: { name: 'list_orgs', title: 'List my organizations', readOnly: true },
    cli: { command: ['orgs', 'list'], columns: ['id', 'name', 'role', 'plan'] },
  },
  getOrg: {
    id: 'getOrg',
    method: 'GET',
    path: '/orgs/{org_id}',
    summary:
      'One organization: plan, the caller’s role, and how many sites and seats it uses out of its limits.',
    auth: 'token',
    scope: 'editor',
    input: {
      type: 'object',
      properties: { org_id: orgId },
      required: ['org_id'],
      additionalProperties: false,
    },
    mcp: { name: 'get_org', title: 'Get an organization', readOnly: true },
    cli: { command: ['orgs', 'get'] },
  },

  // --- Sites ---------------------------------------------------------------

  listSites: {
    id: 'listSites',
    method: 'GET',
    path: '/orgs/{org_id}/sites',
    summary:
      'Every site in an organization, with the caller’s own content role on each (null when they have no access to its content).',
    auth: 'token',
    scope: 'editor',
    input: {
      type: 'object',
      properties: { org_id: orgId },
      required: ['org_id'],
      additionalProperties: false,
    },
    mcp: { name: 'list_sites', title: 'List sites', readOnly: true },
    cli: {
      command: ['sites', 'list'],
      columns: ['id', 'name', 'repo', 'branch', 'my_role', 'is_locked'],
    },
  },
  getSite: {
    id: 'getSite',
    method: 'GET',
    path: '/sites/{site_id}',
    summary: 'One site: its repository, branch, config path, admin URL and lock state.',
    auth: 'token',
    scope: 'editor',
    input: {
      type: 'object',
      properties: { site_id: siteId },
      required: ['site_id'],
      additionalProperties: false,
    },
    mcp: { name: 'get_site', title: 'Get a site', readOnly: true },
    cli: { command: ['sites', 'get'] },
  },
  createSite: {
    id: 'createSite',
    method: 'POST',
    path: '/orgs/{org_id}/sites',
    summary:
      'Create a site in an organization. Organization owners only; counts against the plan’s site limit. The creator gets full content access.',
    auth: 'token',
    scope: 'admin',
    input: {
      type: 'object',
      properties: { org_id: orgId, ...siteFields },
      required: ['org_id', 'name'],
      additionalProperties: false,
    },
    mcp: { name: 'create_site', title: 'Create a site', readOnly: false, destructive: false },
    cli: { command: ['sites', 'create'] },
  },
  updateSite: {
    id: 'updateSite',
    method: 'PATCH',
    path: '/sites/{site_id}',
    summary:
      'Change a site’s name, repository, branch, config path or admin URL. Only the fields sent change. Organization owners only.',
    auth: 'token',
    scope: 'admin',
    input: {
      type: 'object',
      properties: { site_id: siteId, ...siteFields },
      required: ['site_id'],
      additionalProperties: false,
    },
    mcp: { name: 'update_site', title: 'Update a site', readOnly: false, destructive: false },
    cli: { command: ['sites', 'update'] },
  },
  clearCache: {
    id: 'clearCache',
    method: 'POST',
    path: '/sites/{site_id}/cache/clear',
    summary:
      'Clear a site’s content cache. It repopulates from the repository on the next CMS load. Organization owners only.',
    auth: 'token',
    scope: 'admin',
    input: {
      type: 'object',
      properties: { site_id: siteId },
      required: ['site_id'],
      additionalProperties: false,
    },
    mcp: {
      name: 'clear_cache',
      title: 'Clear a site’s content cache',
      readOnly: false,
      destructive: false,
    },
    cli: { command: ['cache', 'clear'] },
  },
  listDeploys: {
    id: 'listDeploys',
    method: 'GET',
    path: '/sites/{site_id}/deploys',
    summary: 'A site’s most recent deploys, newest first, as reported by its host or git provider.',
    auth: 'token',
    scope: 'editor',
    input: {
      type: 'object',
      properties: {
        site_id: siteId,
        limit: { type: 'integer', minimum: 1, maximum: 50, description: 'How many, default 10' },
      },
      required: ['site_id'],
      additionalProperties: false,
    },
    mcp: { name: 'list_deploys', title: 'List recent deploys', readOnly: true },
    cli: {
      command: ['deploys', 'list'],
      columns: ['state', 'commit_sha', 'target', 'updated_at', 'url'],
    },
  },

  // --- Organization members and invitations -------------------------------

  listMembers: {
    id: 'listMembers',
    method: 'GET',
    path: '/orgs/{org_id}/members',
    summary:
      'An organization’s members and their roles. Pending invitations are included for organization owners.',
    auth: 'token',
    scope: 'editor',
    input: {
      type: 'object',
      properties: { org_id: orgId },
      required: ['org_id'],
      additionalProperties: false,
    },
    mcp: { name: 'list_members', title: 'List organization members', readOnly: true },
    cli: { command: ['members', 'list'], columns: ['email', 'role', 'user_id'] },
  },
  inviteMember: {
    id: 'inviteMember',
    method: 'POST',
    path: '/orgs/{org_id}/invitations',
    summary:
      'Invite someone to an organization by email; they get an email with a link. Optionally give them full content access to some sites. Organization owners only; counts against the plan’s seat limit.',
    auth: 'token',
    scope: 'admin',
    input: {
      type: 'object',
      properties: {
        org_id: orgId,
        email: { type: 'string', minLength: 3, maxLength: 320, description: 'Who to invite' },
        role: {
          type: 'string',
          enum: ['owner', 'member'],
          description: 'Organization role, default member',
        },
        site_ids: {
          type: 'string',
          maxLength: 4000,
          description: 'Comma-separated site ids to give full content access to on acceptance',
        },
      },
      required: ['org_id', 'email'],
      additionalProperties: false,
    },
    mcp: { name: 'invite_member', title: 'Invite a member', readOnly: false, destructive: false },
    cli: { command: ['members', 'invite'] },
  },
  resendInvitation: {
    id: 'resendInvitation',
    method: 'POST',
    path: '/orgs/{org_id}/invitations/{invitation_id}/resend',
    summary:
      'Send a pending invitation again with a fresh link; the old link stops working. Organization owners only.',
    auth: 'token',
    scope: 'admin',
    input: {
      type: 'object',
      properties: {
        org_id: orgId,
        invitation_id: {
          type: 'string',
          pattern: UUID,
          description: 'Invitation id (see list_members)',
        },
      },
      required: ['org_id', 'invitation_id'],
      additionalProperties: false,
    },
    mcp: {
      name: 'resend_invitation',
      title: 'Resend an invitation',
      readOnly: false,
      destructive: false,
    },
    cli: { command: ['invitations', 'resend'] },
  },
  revokeInvitation: {
    id: 'revokeInvitation',
    method: 'DELETE',
    path: '/orgs/{org_id}/invitations/{invitation_id}',
    summary: 'Revoke a pending invitation so its link stops working. Organization owners only.',
    auth: 'token',
    scope: 'admin',
    input: {
      type: 'object',
      properties: {
        org_id: orgId,
        invitation_id: {
          type: 'string',
          pattern: UUID,
          description: 'Invitation id (see list_members)',
        },
      },
      required: ['org_id', 'invitation_id'],
      additionalProperties: false,
    },
    mcp: {
      name: 'revoke_invitation',
      title: 'Revoke an invitation',
      readOnly: false,
      destructive: true,
    },
    cli: { command: ['invitations', 'revoke'] },
  },
  setMemberRole: {
    id: 'setMemberRole',
    method: 'PATCH',
    path: '/orgs/{org_id}/members/{member}',
    summary:
      'Make an organization member an owner or a member. The last owner cannot be demoted. Organization owners only.',
    auth: 'token',
    scope: 'admin',
    input: {
      type: 'object',
      properties: {
        org_id: orgId,
        member,
        role: {
          type: 'string',
          enum: ['owner', 'member'],
          description: 'The new organization role',
        },
      },
      required: ['org_id', 'member', 'role'],
      additionalProperties: false,
    },
    mcp: {
      name: 'set_member_role',
      title: 'Change a member’s organization role',
      readOnly: false,
      destructive: false,
    },
    cli: { command: ['members', 'set-role'] },
  },
  removeMember: {
    id: 'removeMember',
    method: 'DELETE',
    path: '/orgs/{org_id}/members/{member}',
    summary:
      'Remove someone from an organization, and with it their access to its sites. The last owner cannot be removed. Organization owners only.',
    auth: 'token',
    scope: 'admin',
    input: {
      type: 'object',
      properties: { org_id: orgId, member },
      required: ['org_id', 'member'],
      additionalProperties: false,
    },
    mcp: {
      name: 'remove_member',
      title: 'Remove an organization member',
      readOnly: false,
      destructive: true,
    },
    cli: { command: ['members', 'remove'] },
  },

  // --- Site members and roles ---------------------------------------------

  listSiteMembers: {
    id: 'listSiteMembers',
    method: 'GET',
    path: '/sites/{site_id}/members',
    summary:
      'Who has content access to a site, with each member’s role and any per-collection overrides. Organization owners only.',
    auth: 'token',
    scope: 'admin',
    input: {
      type: 'object',
      properties: { site_id: siteId },
      required: ['site_id'],
      additionalProperties: false,
    },
    mcp: { name: 'list_site_members', title: 'List a site’s members', readOnly: true },
    cli: { command: ['site-members', 'list'], columns: ['email', 'role', 'user_id'] },
  },
  addSiteMember: {
    id: 'addSiteMember',
    method: 'POST',
    path: '/sites/{site_id}/members',
    summary:
      'Give an organization member content access to a site, with a site role (default Full access). Organization owners only.',
    auth: 'token',
    scope: 'admin',
    input: {
      type: 'object',
      properties: {
        site_id: siteId,
        member,
        site_role_id: {
          type: 'string',
          pattern: UUID,
          description: 'Site role id (see list_roles), default Full access',
        },
      },
      required: ['site_id', 'member'],
      additionalProperties: false,
    },
    mcp: {
      name: 'add_site_member',
      title: 'Add a site member',
      readOnly: false,
      destructive: false,
    },
    cli: { command: ['site-members', 'add'] },
  },
  setSiteMemberRole: {
    id: 'setSiteMemberRole',
    method: 'PATCH',
    path: '/sites/{site_id}/members/{member}',
    summary:
      'Put a site member on a different site role, replacing any per-collection overrides. Organization owners only.',
    auth: 'token',
    scope: 'admin',
    input: {
      type: 'object',
      properties: {
        site_id: siteId,
        member,
        site_role_id: {
          type: 'string',
          pattern: UUID,
          description: 'Site role id (see list_roles)',
        },
      },
      required: ['site_id', 'member', 'site_role_id'],
      additionalProperties: false,
    },
    mcp: {
      name: 'set_site_member_role',
      title: 'Change a site member’s role',
      readOnly: false,
      destructive: false,
    },
    cli: { command: ['site-members', 'set-role'] },
  },
  removeSiteMember: {
    id: 'removeSiteMember',
    method: 'DELETE',
    path: '/sites/{site_id}/members/{member}',
    summary:
      'Remove someone’s content access to a site. They stay in the organization. Organization owners only.',
    auth: 'token',
    scope: 'admin',
    input: {
      type: 'object',
      properties: { site_id: siteId, member },
      required: ['site_id', 'member'],
      additionalProperties: false,
    },
    mcp: {
      name: 'remove_site_member',
      title: 'Remove a site member',
      readOnly: false,
      destructive: true,
    },
    cli: { command: ['site-members', 'remove'] },
  },
  listRoles: {
    id: 'listRoles',
    method: 'GET',
    path: '/sites/{site_id}/roles',
    summary:
      'A site’s roles: the built-in Full access role and any custom ones, each with its per-collection access. Organization owners only.',
    auth: 'token',
    scope: 'admin',
    input: {
      type: 'object',
      properties: { site_id: siteId },
      required: ['site_id'],
      additionalProperties: false,
    },
    mcp: { name: 'list_roles', title: 'List a site’s roles', readOnly: true },
    cli: { command: ['roles', 'list'], columns: ['id', 'name', 'is_builtin'] },
  },

  // --- Editor bridge ----------------------------------------------------------
  // An agent works on the entry a person has open in the CMS: it reads what is
  // on screen, sets fields, and the person reviews and saves. Editor scope:
  // this is content editing, the same as typing in the editor.

  getOpenEditor: {
    id: 'getOpenEditor',
    method: 'GET',
    path: '/editor/sessions',
    summary:
      'The entries the caller has open in the CMS right now, each with its fields and current, unsaved values. Call this before set_fields to get the session id and see what is on screen.',
    auth: 'token',
    scope: 'editor',
    input: {
      type: 'object',
      properties: { site_id: { ...siteId, description: 'Only editors open on this site' } },
      additionalProperties: false,
    },
    mcp: { name: 'get_open_editor', title: 'Read the entry open in the CMS', readOnly: true },
    cli: {
      command: ['editor', 'list'],
      columns: ['session_id', 'site_name', 'collection', 'slug', 'updated_at'],
    },
  },
  setFields: {
    id: 'setFields',
    method: 'POST',
    path: '/editor/sessions/{session_id}/fields',
    summary:
      'Change fields in an entry open in the CMS, without saving: the changes appear in the person’s editor, highlighted, for them to review and save. `fields` maps a field name, or a dotted path into an object or list (seo.description, tags.0), to its new value; markdown fields take a markdown string. Waits a few seconds for the editor to apply them and reports which paths applied.',
    auth: 'token',
    scope: 'editor',
    input: {
      type: 'object',
      properties: {
        session_id: {
          type: 'string',
          pattern: UUID,
          description: 'Editor session id (see get_open_editor)',
        },
        fields: {
          type: 'object',
          additionalProperties: true,
          description:
            'New values keyed by field path, e.g. {"title": "…", "seo.description": "…"}',
        },
        locale: {
          type: 'string',
          maxLength: 20,
          description:
            'Another locale of an i18n collection to write to; the default locale otherwise',
        },
      },
      required: ['session_id', 'fields'],
      additionalProperties: false,
    },
    mcp: {
      name: 'set_fields',
      title: 'Set fields in the open editor',
      readOnly: false,
      destructive: false,
    },
    cli: { command: ['editor', 'set'] },
  },
  openInEditor: {
    id: 'openInEditor',
    method: 'GET',
    path: '/sites/{site_id}/editor-url',
    summary:
      'The CMS address of a site, or of one collection or entry in it, for the person to open in their browser — the editor must be open before set_fields can change it.',
    auth: 'token',
    scope: 'editor',
    input: {
      type: 'object',
      properties: {
        site_id: siteId,
        collection: {
          type: 'string',
          maxLength: 200,
          description: 'Collection name, to open its list or one of its entries',
        },
        slug: {
          type: 'string',
          maxLength: 500,
          description: 'Entry slug (or file name in a file collection); omit for a new entry',
        },
        new_entry: { type: 'boolean', description: 'Open a new, empty entry in the collection' },
      },
      required: ['site_id'],
      additionalProperties: false,
    },
    mcp: { name: 'open_in_editor', title: 'Get the CMS link for an entry', readOnly: true },
    cli: { command: ['editor', 'open'] },
  },
} as const satisfies Record<string, Operation>;

export type OperationId = keyof typeof operations;

// --- Requests --------------------------------------------------------------

/** `{org_id}` → `org_id`, for each templated segment of an operation's path. */
export function pathParams(op: Pick<Operation, 'path'>): string[] {
  return [...op.path.matchAll(/\{(\w+)\}/g)].map(m => m[1]);
}

/**
 * Splits validated input into the request a client sends: path segments
 * filled from their fields, the rest as the query string (GET, DELETE) or
 * JSON body. The single place request shapes are decided, so the CLI, the MCP
 * server and tests cannot build a URL differently.
 */
export function buildRequest(
  op: Pick<Operation, 'path' | 'method'>,
  input: Record<string, unknown>,
): { path: string; query: Record<string, string>; body: Record<string, unknown> | null } {
  const params = new Set(pathParams(op));
  const path = op.path.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = input[name];
    if (value === undefined || value === null || value === '') {
      throw new Error(`Missing path parameter "${name}".`);
    }
    return encodeURIComponent(String(value));
  });
  const rest = Object.fromEntries(
    Object.entries(input).filter(
      ([key, value]) => !params.has(key) && value !== undefined && value !== null,
    ),
  );
  if (op.method === 'GET' || op.method === 'DELETE') {
    return {
      path,
      query: Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, String(v)])),
      body: null,
    };
  }
  return { path, query: {}, body: rest };
}

/** The CLI flag for an input field: `org_id` → `org`, `config_path` → `config-path`. */
export function flagName(field: string): string {
  return field.replace(/_id$/, '').replace(/_/g, '-');
}

// --- Response shapes -------------------------------------------------------

export interface ApiError {
  error: { code: string; message: string };
}

export type OrgRole = 'owner' | 'member';

export interface MeResponse {
  user: { id: string; email: string | null; name: string | null };
  /** Null when the caller is a dashboard session rather than a token. */
  token: { id: string; name: string; scope: Scope; expires_at: string | null } | null;
  organizations: Array<{ id: string; name: string; plan: string; role: OrgRole }>;
}

export interface CliTokenResponse {
  token: string;
  token_id: string;
  scope: Scope;
  expires_at: string | null;
}

export interface OrgSummary {
  id: string;
  name: string;
  plan: string;
  role: OrgRole;
}

export interface OrgDetail extends OrgSummary {
  sites: { used: number; limit: number };
  seats: { used: number; limit: number };
}

export interface SiteSummary {
  id: string;
  name: string;
  provider: 'github' | 'gitlab';
  repo: string | null;
  branch: string;
  is_locked: boolean;
  /** The caller's content role on the site, or null when they have no site membership. */
  my_role: string | null;
}

export interface SiteDetail extends Omit<SiteSummary, 'my_role'> {
  organization_id: string;
  config_path: string;
  /** Admin interface URL patterns, one per entry. */
  admin_interface_urls: string[];
  created_at: string;
  updated_at: string;
}

export interface Deploy {
  state: string;
  commit_sha: string;
  /** Which host or provider reported it. */
  target: string;
  url: string | null;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
  updated_at: string;
}

export interface OrgMember {
  user_id: string;
  email: string;
  role: OrgRole;
}

export interface Invitation {
  id: string;
  email: string;
  role: OrgRole;
  created_at: string;
  expires_at: string;
}

export interface MembersResponse {
  members: OrgMember[];
  /** Only for organization owners; empty otherwise. */
  invitations: Invitation[];
}

export interface InvitationResponse {
  invitation: Invitation;
  message: string;
  /** Set when the invitation exists but its email could not be sent; resend it. */
  warning?: string;
}

export type CollectionAccess = 'edit' | 'view' | 'none';

export interface SiteMember {
  user_id: string;
  email: string;
  /** The site role's id, or null for a member with their own per-collection overrides. */
  site_role_id: string | null;
  role: string;
  /** Per-collection overrides; a collection not listed is fully editable. */
  collections: Record<string, CollectionAccess>;
}

export interface SiteRole {
  id: string;
  name: string;
  is_builtin: boolean;
  collections: Record<string, CollectionAccess>;
}

export interface EditorSession {
  session_id: string;
  site_id: string;
  site_name: string;
  collection: string;
  /** Null for an entry that has not been saved yet. */
  slug: string | null;
  updated_at: string;
  /** The collection's field definitions, as in config.yml. */
  fields: Record<string, unknown>[];
  /** Current, possibly unsaved, values; null when the entry was too large to share. */
  data: Record<string, unknown> | null;
  /** Other locales' values, keyed by locale. */
  i18n: Record<string, { data: Record<string, unknown> }> | null;
  locales: string[] | null;
  default_locale: string | null;
  has_unsaved_changes: boolean;
}

export interface SetFieldsResponse {
  /** `pending` when the editor did not pick the change up in time; it still applies when the tab is active. */
  status: 'applied' | 'partial' | 'rejected' | 'pending';
  applied: string[];
  rejected: { path: string; reason: string }[];
  message: string;
}

export interface EditorUrlResponse {
  url: string;
}

/** What mutating operations without a richer result return. */
export interface OkResponse {
  ok: true;
  message: string;
}

// --- Validation ------------------------------------------------------------

export type ValidationResult<T = Record<string, unknown>> =
  | { ok: true; value: T }
  | { ok: false; errors: string[] };

/** Validates a request body or query against an operation's input schema. */
export function validateInput<T = Record<string, unknown>>(
  schema: JsonSchemaObject,
  input: unknown,
): ValidationResult<T> {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, errors: ['Body must be a JSON object.'] };
  }

  const errors: string[] = [];
  const value = input as Record<string, unknown>;

  for (const key of Object.keys(value)) {
    if (!(key in schema.properties)) errors.push(`Unknown field "${key}".`);
  }

  for (const key of schema.required ?? []) {
    if (value[key] === undefined || value[key] === null) errors.push(`"${key}" is required.`);
  }

  for (const [key, prop] of Object.entries(schema.properties)) {
    const v = value[key];
    if (v === undefined || v === null) continue;

    if (prop.type === 'string') {
      if (typeof v !== 'string') {
        errors.push(`"${key}" must be a string.`);
        continue;
      }
      if (prop.minLength !== undefined && v.length < prop.minLength)
        errors.push(`"${key}" is too short.`);
      if (prop.maxLength !== undefined && v.length > prop.maxLength)
        errors.push(`"${key}" is too long.`);
      if (prop.pattern !== undefined && !new RegExp(prop.pattern).test(v))
        errors.push(`"${key}" is malformed.`);
      if (prop.enum !== undefined && !prop.enum.includes(v)) {
        errors.push(`"${key}" must be one of: ${prop.enum.join(', ')}.`);
      }
    } else if (prop.type === 'integer' || prop.type === 'number') {
      if (
        typeof v !== 'number' ||
        Number.isNaN(v) ||
        (prop.type === 'integer' && !Number.isInteger(v))
      ) {
        errors.push(`"${key}" must be ${prop.type === 'integer' ? 'an integer' : 'a number'}.`);
        continue;
      }
      if (prop.minimum !== undefined && v < prop.minimum)
        errors.push(`"${key}" must be at least ${prop.minimum}.`);
      if (prop.maximum !== undefined && v > prop.maximum)
        errors.push(`"${key}" must be at most ${prop.maximum}.`);
    } else if (prop.type === 'boolean') {
      if (typeof v !== 'boolean') errors.push(`"${key}" must be true or false.`);
    } else if (prop.type === 'object') {
      if (typeof v !== 'object' || Array.isArray(v)) errors.push(`"${key}" must be a JSON object.`);
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true, value: value as T };
}
