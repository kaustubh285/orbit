import { app } from "../src/app.js"
import { openAPIConfig } from "../src/lib/configure-openapi.js"
import { writeFileSync } from "fs"
import { resolve } from "path"

const spec = app.getOpenAPIDocument(openAPIConfig)

const outPath = resolve(import.meta.dir, "../../client/openapi.json")
writeFileSync(outPath, JSON.stringify(spec, null, 2))

console.log("✓ OpenAPI spec written to packages/client/openapi.json")
