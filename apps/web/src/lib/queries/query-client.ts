import { MutationCache, QueryCache, QueryClient, isServer } from '@tanstack/react-query'

function getJitteredRetryDelay(
  attemptIndex: number,
): number {
  const baseDelay = 500
  const maxDelay = 3000
  const exponentialDelay = Math.min(maxDelay, baseDelay * Math.pow(2, attemptIndex))
  const jitter = 0.5 + Math.random() * 0.5
  return Math.floor(exponentialDelay * jitter)
}

export function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        console.log({
          key: query.queryKey,
          error,
        })
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _vars, _ctx, mutation) => {
        console.log({
          key: mutation.options.mutationKey,
          error,
        })
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, 
        gcTime: 5 * 60 * 1000, 
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
        throwOnError: true,
        retry: 3, 
        retryDelay: getJitteredRetryDelay,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined = undefined

export function getQueryClient() {
  if (isServer) {
    return makeQueryClient()
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}
