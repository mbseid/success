import React from 'react';

// component
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import LinkIcon from '@mui/icons-material/Link';
import AssistantIcon from '@mui/icons-material/Assistant';

// ----------------------------------------------------------------------

const getIcon = (name) => <Iconify icon={name} width={22} height={22} />;

const navConfig = [
  {
    title: 'Dashboard',
    path: '/',
    icon: <DashboardIcon />,
    endMatch: true
  },
  {
    title: 'People',
    path: '/people',
    icon: <PersonIcon />,
    endMatch: false
  },
  {
    title: 'Links',
    path: '/links',
    icon: <LinkIcon />,
    endMatch: false
  },
  {
    title: 'Assistant',
    path: '/assistant',
    icon: <AssistantIcon />,
    endMatch: false
  },
];

export default navConfig;
