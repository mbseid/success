import React from 'react';

import PropTypes from 'prop-types';

// @mui
import { InputAdornment, TextField } from '@mui/material';
// components
import Iconify from '~//components/Iconify';


export default function SearchBar({ placeholder, setSearchQuery }) {
  return (
    <TextField
      sx={{ width: 280 }}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder={placeholder}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Iconify icon={'eva:search-fill'} sx={{ ml: 1, width: 20, height: 20, color: 'text.disabled' }} />
          </InputAdornment>
        )
      }}
    />
  );
}
