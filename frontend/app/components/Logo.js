import React from 'react';

import PropTypes from 'prop-types';
import { Link as RouterLink } from 'react-router-dom';
// @mui
import { useTheme } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';

// ----------------------------------------------------------------------

Logo.propTypes = {
  disabledLink: PropTypes.bool,
  sx: PropTypes.object,
};

export default function Logo({ disabledLink = false, sx }) {
  const theme = useTheme();

  const PRIMARY_LIGHT = theme.palette.primary.light;

  const PRIMARY_MAIN = theme.palette.primary.main;

  const PRIMARY_DARK = theme.palette.primary.dark;

  // OR
  // const logo = <Box component="img" src="/static/logo.svg" sx={{ width: 40, height: 40, ...sx }} />

  const logo = (
    <Box sx={{flexDirection: 'row', display: 'flex', ...sx }}>
      <Box component='img' src="/images/logo.svg" sx={{width: 40, height: 40}}/>
      <Box sx={{
        flexGrow: 2,
        display: 'flex',
        justifyContent: 'start',
        '& p': {
          alignSelf: 'center',
          px: 1,
          color: 'black',
          fontSize: '1.3rem',
          fontWeight: 'bolder',
          fontStyle: 'italic'
        }}}>
        <Typography>
          Success
        </Typography>
      </Box>
    </Box>
  );

  if (disabledLink) {
    return <>{logo}</>;
  }

  return <RouterLink to="/" style={{width: '100%', textDecoration: 'none'}}>{logo}</RouterLink>;
}
