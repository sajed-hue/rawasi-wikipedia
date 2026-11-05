import { QueryClient } from "@tanstack/react-query";
import { isApiError } from "./api/problem";

export const createSessionQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) =>
          isApiError(error) ? error.isTransient && failureCount < 2 : failureCount < 2,
      },
    },
  });
