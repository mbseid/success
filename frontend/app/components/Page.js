import React from 'react';

import { forwardRef } from 'react';
// @mui
import { Box } from '@mui/material';

// ----------------------------------------------------------------------

const Page = forwardRef(({ children, title = '', meta, ...other }, ref) => (
  <>
    <Box ref={ref} {...other}>
      {children}
    </Box>
  </>
));

export default Page;
