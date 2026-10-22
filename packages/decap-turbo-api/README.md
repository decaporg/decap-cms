# decap-turbo-api

> **Experimental.** Operations, input schemas and response types may change in any release, including a patch release, as the Turbo API evolves. Pin an exact version if you depend on it. Most people want the CLI, [`@decap/cli`](../decap), rather than this package.

The [Decap Turbo](https://decapcms.org/docs/turbo-cli-and-agents/) API contract: one definition per operation, with its HTTP method and path, the token scope it needs, a JSON Schema for its input, and the MCP tool and CLI command it is exposed as. Shared by `@decap/cli` and the Turbo server, so the two cannot disagree about the API.

Dependency-free. Input schemas are plain JSON Schema; `validateInput(schema, body)` checks a request body against one.

```ts
import { operations, validateInput } from 'decap-turbo-api';

const result = validateInput(operations.cliToken.input, body);
if (!result.ok) console.error(result.errors);
```
