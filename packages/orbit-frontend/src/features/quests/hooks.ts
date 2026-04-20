import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getQuests, getQuestsById, postQuests, patchQuestsById } from "@orbit/client"
import { queryClient } from "@/lib/query"

const questKeys = {
  all: ["quests"] as const,
  filtered: (params: Record<string, string | undefined>) => ["quests", params] as const,
  detail: (id: string) => ["quests", id] as const,
}

export const useQuests = (
  userId: string,
  params: { type?: string; status?: string; priority?: string } = {},
) =>
  useQuery({
    queryKey: questKeys.filtered(params),
    queryFn: () =>
      getQuests({ query: params, headers: { "x-user-id": userId } }),
  })

export const useQuest = (userId: string, id: string) =>
  useQuery({
    queryKey: questKeys.detail(id),
    queryFn: () =>
      getQuestsById({ path: { id }, headers: { "x-user-id": userId } }),
  })

export const prefetchQuests = (userId: string) =>
  queryClient.prefetchQuery({
    queryKey: questKeys.all,
    queryFn: () => getQuests({ headers: { "x-user-id": userId } }),
  })

export const useCreateQuest = (userId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof postQuests>[0]["body"]) =>
      postQuests({ body, headers: { "x-user-id": userId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: questKeys.all }),
  })
}

export const useUpdateQuest = (userId: string, id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof patchQuestsById>[0]["body"]) =>
      patchQuestsById({ path: { id }, body, headers: { "x-user-id": userId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: questKeys.all })
      qc.invalidateQueries({ queryKey: questKeys.detail(id) })
    },
  })
}
