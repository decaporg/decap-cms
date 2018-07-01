import { supportedFormats, frontmatterFormats } from "Formats/formats";
import { IDENTIFIER_FIELDS } from "Constants/fieldInference";

export default {
  type: "object",
  properties: {
    backend: {
      type: "object",
      properties: { name: { type: "string", examples: ["test-repo"] } },
      required: ["name"],
    },
    display_url: { type: "string", examples: ["https://example.com"] },
    media_folder: { type: "string", examples: ["assets/uploads"] },
    publish_mode: {
      type: "string",
      enum: ["editorial_workflow"],
      examples: ["editorial_workflow"],
    },
    slug: {
      type: "object",
      properties: {
        encoding: { type: "string", enum: ["unicode", "ascii"] },
        clean_accents: { type: "boolean" },
      },
    },
    collections: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        properties: {
          format: { type: "string", enum: supportedFormats },
          frontmatter_delimiter: { type: "string" },
        },
        oneOf: [
          { required: ["files"] },
          {
            required: ["folder"],
            properties: {
              fields: {
                type: "array",
                contains: {
                  type: "object",
                  properties: {
                    name: { type: "string", enum: IDENTIFIER_FIELDS },
                  },
                },
              },
            },
          },
        ],
        dependencies: {
          frontmatter_delimiter: {
            properties: {
              format: { enum: frontmatterFormats },
            },
            required: ["format"],
          },
        },
      },
    },
  },
  required: ["backend", "media_folder", "collections"],
};
