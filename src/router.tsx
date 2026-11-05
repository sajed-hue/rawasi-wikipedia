import { createRouter } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { routeTree } from "./routeTree.gen";

const getNonce = createIsomorphicFn()
  .server(() => getRequestHeader("x-rawasi-csp-nonce"))
  .client(() => document.querySelector<HTMLMetaElement>('meta[property="csp-nonce"]')?.content);

export const getRouter = () => {
  const nonce = getNonce();
  return createRouter({
    routeTree,
    scrollRestoration: true,
    ssr: nonce ? { nonce } : {},
    defaultPreloadStaleTime: 0,
  });
};
