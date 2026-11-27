import { describe, expect, it } from "vitest";
import { jsonLd } from "./json-ld";

describe("dados estruturados (JSON-LD)", () => {
  it("um título com </script> não fecha a tag", () => {
    const html = jsonLd({ name: "Casa</script><script>alert(1)</script>" });
    expect(html).not.toMatch(/<\/script/i);
    expect(html).not.toContain("<");
  });

  it("continua sendo o mesmo JSON depois de lido", () => {
    const data = { name: "Apto <novo> & reformado", price: 1500 };
    expect(JSON.parse(jsonLd(data))).toEqual(data);
  });
});
