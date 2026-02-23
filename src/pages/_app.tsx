import "@/styles/globals.css";
import type { AppProps } from "next/app";
import type { NextPage } from "next";
import type { ReactElement, ReactNode } from "react";
import { trpc } from "@/utils/trpc";
import SidebarLayout from "@/components/layouts/SidebarLayout";
import { SessionProvider } from "@/lib/context/sessionContext";

export type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function App({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout =
    Component.getLayout ??
    ((page) => (
      <SessionProvider>
        <SidebarLayout>{page}</SidebarLayout>
      </SessionProvider>
    ));

  return getLayout(<Component {...pageProps} />);
}

export default trpc.withTRPC(App);
