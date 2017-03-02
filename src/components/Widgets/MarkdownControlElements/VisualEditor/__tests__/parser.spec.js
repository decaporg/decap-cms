import { Schema } from "prosemirror-model";
import { schema } from "prosemirror-markdown";

const makeParser = require("../parser");

const testSchema = new Schema({
  nodes: schema.nodeSpec,
  marks: schema.markSpec,
});
const parser = makeParser(testSchema);

describe("Compile markdown to Prosemirror document structure", () => {
  it("should compile simple markdown", () => {
    const value = `
# H1

sweet body
`;
    expect(parser(value)).toMatchSnapshot();
  });

  it("should compile a markdown ordered list", () => {
    const value = `
# H1

1. yo
2. bro
3. fro
`;
    expect(parser(value)).toMatchSnapshot();
  });

  it("should compile bulleted lists", () => {
    const value = `
# H1

* yo
* bro
* fro
`;
    expect(parser(value)).toMatchSnapshot();
  });

  it("should compile multiple header levels", () => {
    const value = `
# H1

## H2

### H3
`;
    expect(parser(value)).toMatchSnapshot();
  });

  it("should compile horizontal rules", () => {
    const value = `
# H1

---

blue moon
`;
    expect(parser(value)).toMatchSnapshot();
  });

  it("should compile horizontal rules", () => {
    const value = `
# H1

---

blue moon
`;
    expect(parser(value)).toMatchSnapshot();
  });

  it("should compile hard breaks (double space)", () => {
    const value = `
blue moon  
footballs
`;
    expect(parser(value)).toMatchSnapshot();
  });

  it("should compile images", () => {
    const value = `
![super](duper.jpg)
`;
    expect(parser(value)).toMatchSnapshot();
  });
});
