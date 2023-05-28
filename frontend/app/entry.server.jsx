/**
 * By default, Remix will handle generating the HTTP Response for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.server
 */

import * as ReactDOMServer from 'react-dom/server';

import { Response } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";

import { theme, createEmotionCache } from '~/theme';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { CacheProvider } from '@emotion/react';
import createEmotionServer from '@emotion/server/create-instance';

const ABORT_DELAY = 5_000;

export default function handleRequest(
  request,
  responseStatusCode,
  responseHeaders,
  remixContext
) {
  const cache = createEmotionCache();
  const { extractCriticalToChunks } = createEmotionServer(cache);

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


//   return isbot(request.headers.get("user-agent"))
//     ? handleBotRequest(
//         request,
//         responseStatusCode,
//         responseHeaders,
//         remixContext
//       )
//     : handleBrowserRequest(
//         request,
//         responseStatusCode,
//         responseHeaders,
//         remixContext
//       );
// }

// function handleBotRequest(
//   request,
//   responseStatusCode,
//   responseHeaders,
//   remixContext
// ) {
//   return new Promise((resolve, reject) => {
//     const { pipe, abort } = renderToPipeableStream(
//       <RemixServer
//         context={remixContext}
//         url={request.url}
//         abortDelay={ABORT_DELAY}
//       />,

//       {
//         onAllReady() {
//           const body = new PassThrough();

//           responseHeaders.set("Content-Type", "text/html");

//           resolve(
//             new Response(body, {
//               headers: responseHeaders,
//               status: responseStatusCode,
//             })
//           );

//           pipe(body);
//         },
//         onShellError(error) {
//           reject(error);
//         },
//         onError(error) {
//           responseStatusCode = 500;
//           console.error(error);
//         },
//       }
//     );

//     setTimeout(abort, ABORT_DELAY);
//   });
// }

// function handleBrowserRequest(
//   request,
//   responseStatusCode,
//   responseHeaders,
//   remixContext
// ) {
//   return new Promise((resolve, reject) => {
//     const { pipe, abort } = renderToPipeableStream(
//       <RemixServer
//         context={remixContext}
//         url={request.url}
//         abortDelay={ABORT_DELAY}
//       />,

//       {
//         onShellReady() {
//           const body = new PassThrough();

//           responseHeaders.set("Content-Type", "text/html");

//           resolve(
//             new Response(body, {
//               headers: responseHeaders,
//               status: responseStatusCode,
//             })
//           );

//           pipe(body);
//         },
//         onShellError(error) {
//           reject(error);
//         },
//         onError(error) {
//           console.error(error);
//           responseStatusCode = 500;
//         },
//       }
//     );

//     setTimeout(abort, ABORT_DELAY);
//   });
// }
