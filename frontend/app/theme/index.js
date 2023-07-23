
import {createContext} from 'react';

import createCache from '@emotion/cache';

// material
import { ThemeProvider as MUIThemeProvider, createTheme, StyledEngineProvider } from '@mui/material/styles';
//
import palette from './palette';
import typography from './typography';
import componentsOverride from './overrides';
import shadows, { customShadows } from './shadows';

import merge from 'lodash.merge';

export function createEmotionCache() {
  return createCache({ key: 'css' });
}

export const clientStyleContext = createContext({
  reset: () => {},
});

export function createSuccessTheme(deviceType = 'desktop', extensions = {}) {
  
  const theme = createTheme({
    palette,
    shape: { borderRadius: 8 },
    typography,
    shadows,
    customShadows
  });
  theme.components = componentsOverride(theme);
  const merged = merge(theme, extensions);

  return merged;
}
