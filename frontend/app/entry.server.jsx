/**
 * By default, Remix will handle generating the HTTP Response for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.server
 */

import * as ReactDOMServer from 'react-dom/server';

import { Response } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";

import { createSuccessTheme, createEmotionCache } from '~/theme';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { CacheProvider } from '@emotion/react';
import createEmotionServer from '@emotion/server/create-instance';

import parser from 'ua-parser-js';
import mediaQuery from 'css-mediaquery';



export default function handleRequest(
  request,
  responseStatusCode,
  responseHeaders,
  remixContext
) {
  const cache = createEmotionCache();
  const { extractCriticalToChunks } = createEmotionServer(cache);

  const deviceType = parser(request.headers.get('user-agent')).device.type || 'desktop';
  const ssrMatchMedia = (query) => ({
    matches: mediaQuery.match(query, {
      // The estimated CSS width of the browser.
      width: deviceType == 'desktop' ? '1024px' : '300px'
    }),
  });

  const theme = createSuccessTheme(deviceType, {
    components: {
      // Change the default options of useMediaQuery
      MuiUseMediaQuery: {
        defaultProps: {
          ssrMatchMedia,
        },
      },
    }
  })
  
  function MuiRemixServer() {
    return (
      <CacheProvider value={cache}>
        <ThemeProvider theme={theme}>
          {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
          <CssBaseline />
          <RemixServer context={remixContext} url={request.url} />
        </ThemeProvider>
      </CacheProvider>
    );
  }

  // Render the component to a string.
  const html = ReactDOMServer.renderToString(<MuiRemixServer />);

  // Grab the CSS from emotion
  const { styles } = extractCriticalToChunks(html);

  let stylesHTML = '';

  styles.forEach(({ key, ids, css }) => {
    const emotionKey = `${key} ${ids.join(' ')}`;
    const newStyleTag = `<style data-emotion="${emotionKey}">${css}</style>`;
    stylesHTML = `${stylesHTML}${newStyleTag}`;
  });

  // Add the Emotion style tags after the insertion point meta tag
  const markup = html.replace(
    /<meta(\s)*name="emotion-insertion-point"(\s)*content="emotion-insertion-point"(\s)*\/>/,
    `<meta name="emotion-insertion-point" content="emotion-insertion-point"/>${stylesHTML}`,
  );

  responseHeaders.set('Content-Type', 'text/html');

  return new Response(`<!DOCTYPE html>${markup}`, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
}