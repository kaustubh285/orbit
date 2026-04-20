import { defineConfig } from "@hey-api/openapi-ts"

export default defineConfig({
  input: "./openapi.json",
  output: {
    path: "src/generated",
    format: "prettier",
  },
  plugins: [
    "@hey-api/client-fetch",
    {
      name: "@tanstack/react-query",
    },
  ],
})
