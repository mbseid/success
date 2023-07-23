import * as React from 'react';
import { cssBundleHref } from "@remix-run/css-bundle";

import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

import { withEmotionCache } from '@emotion/react';
import { unstable_useEnhancedEffect as useEnhancedEffect } from '@mui/material';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { clientStyleContext} from '~/theme';

import DashboardLayout from "~/layouts/dashboard"


export const links = () => [
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

const Document = withEmotionCache(({ children, title }, emotionCache) => {
  const clientStyleData = React.useContext(clientStyleContext);

  // Only executed on client
  useEnhancedEffect(() => {
    // re-link sheet container
    emotionCache.sheet.container = document.head;
    // re-inject tags
    const tags = emotionCache.sheet.tags;
    emotionCache.sheet.flush();
    tags.forEach((tag) => {
      // eslint-disable-next-line no-underscore-dangle
      emotionCache.sheet._insertTag(tag);
    });
    // reset cache to reapply global styles
    clientStyleData.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        {title ? <title>{title}</title> : null}
        <Meta />
        <Links />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
        />
        <meta name="emotion-insertion-point" content="emotion-insertion-point" />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
});


export default function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} >
      <Document>
        <DashboardLayout>
          <Outlet />
        </DashboardLayout>
      </Document>
    </LocalizationProvider>
  );
}