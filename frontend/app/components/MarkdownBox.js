import styled from "@emotion/styled";
import { Box } from '@mui/material';

export default styled(Box)({
    '& ul': {
        padding: 'revert'
    },
    '& li': {
        padding: 'revert'
    },
    '& p:not(:last-child)': {
        marginBottom: '1rem'
    }
});
