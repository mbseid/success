
import {createContext} from 'react';

import createCache from '@emotion/cache';

// material
import { ThemeProvider as MUIThemeProvider, createTheme, StyledEngineProvider } from '@mui/material/styles';
//
import palette from './palette';
import typography from './typography';
import componentsOverride from './overrides';
import shadows, { customShadows } from './shadows';

export function createEmotionCache() {
  return createCache({ key: 'css' });
}

export const clientStyleContext = createContext({
  reset: () => {},
});

export function createTheTheme() {
  const theme = createTheme({
    palette,
    shape: { borderRadius: 8 },
    typography,
    shadows,
    customShadows,
  });
  theme.components = componentsOverride(theme);

  return theme;
}

export const theme = createTheTheme();

//   return (
//     <StyledEngineProvider injectFirst>
//       <MUIThemeProvider theme={theme}>
//         <CssBaseline />
//         {children}
//       </MUIThemeProvider>
//     </StyledEngineProvider>
//   );
// }
