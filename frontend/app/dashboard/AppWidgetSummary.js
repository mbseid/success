import { alpha, styled } from '@mui/material/styles';
import { Card, CardActionArea, Typography } from '@mui/material';
// utils
import { fShortenNumber } from '~//utils/formatNumber';
// components
import Iconify from '~//components/Iconify';
import { Box } from '@mui/system';

// ----------------------------------------------------------------------

const IconWrapperStyle = styled('div')(({ theme }) => ({
  margin: 'auto',
  display: 'flex',
  borderRadius: '50%',
  alignItems: 'center',
  width: theme.spacing(8),
  height: theme.spacing(8),
  justifyContent: 'center',
  marginBottom: theme.spacing(3),
}));

// ----------------------------------------------------------------------
export default function AppWidgetSummary({ title, total, icon, color = 'primary', sx, onClick, ...other }) {
  return (
    <Card
      {...other}
      >
      <CardActionArea onClick={onClick}>
        <Box
          sx={{
            py: 5,
            boxShadow: 0,
            textAlign: 'center',
            color: (theme) => theme.palette[color].darker,
            bgcolor: (theme) => theme.palette[color].lighter,
            ...sx,
          }}
          >
          <IconWrapperStyle
            sx={{
              color: (theme) => theme.palette[color].dark,
              backgroundImage: (theme) =>
                `linear-gradient(135deg, ${alpha(theme.palette[color].dark, 0)} 0%, ${alpha(
                  theme.palette[color].dark,
                  0.24
                )} 100%)`,
            }}
          >
            <Iconify icon={icon} width={24} height={24} />
          </IconWrapperStyle>

          <Typography variant="h3">{fShortenNumber(total)}</Typography>

          <Typography variant="subtitle2" sx={{ opacity: 0.72 }}>
            {title}
          </Typography>
        </Box>
      </CardActionArea>
    </Card>
  );
}
