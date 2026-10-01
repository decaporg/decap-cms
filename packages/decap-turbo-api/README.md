# decap-turbo-api

The [Decap Turbo](https://turbo.decapcms.org) API contract: one definition per operation, with its HTTP method and path, the token scope it needs, a JSON Schema for its input, and the MCP tool it is exposed as. Shared by the [`decap`](../decap) CLI and the Turbo server, so the two cannot disagree about the API.

Dependency-free. Input schemas are plain JSON Schema; `validateInput(schema, body)` checks a request body against one.

```ts
import { operations, validateInput } from 'decap-turbo-api';

const result = validateInput(operations.cliToken.input, body);
if (!result.ok) console.error(result.errors);
```
