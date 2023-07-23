import React from 'react';

import PropTypes from 'prop-types';

// @mui
import { InputAdornment, TextField } from '@mui/material';
// components
import SearchIcon from '@mui/icons-material/Search';


export default function SearchBar({ placeholder, setSearchQuery }) {
  return (
    <TextField
      sx={{ width: 280 }}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder={placeholder}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ ml: 1, width: 20, height: 20, color: 'text.disabled' }} />
          </InputAdornment>
        )
      }}
    />
  );
}
