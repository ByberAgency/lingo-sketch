import { useQuery } from "@tanstack/react-query"
import { getAuthMeOptions } from "@lingo-sketch/api-client"
import { useAuth } from "../../auth/AuthProvider"

export const useAuthMe = () => {
    const { user } = useAuth()

    return useQuery({
        ...getAuthMeOptions(),
        enabled: !!user,
        refetchOnMount: "always",
    })
}
