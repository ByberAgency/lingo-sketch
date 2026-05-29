import { defineConfig } from "@hey-api/openapi-ts"

export default defineConfig({
    input: "../../apps/api/openapi.json",
    output: {
        path: "src/generated",
        tsConfigPath: "./tsconfig.json",
        postProcess: ["prettier"],
    },
    plugins: [
        "@hey-api/client-fetch",
        "@hey-api/sdk",
        "@hey-api/typescript",
        {
            name: "@tanstack/react-query",
            includeInEntry: true,
            useQuery: true,
            useMutation: true,
        },
    ],
})
