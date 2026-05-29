import { useQuery } from "@tanstack/react-query"
import { getHealthOptions } from "@lingo-sketch/api-client"

export const useHealth = () =>
    useQuery({
        ...getHealthOptions(),
        refetchOnMount: "always",
    })
