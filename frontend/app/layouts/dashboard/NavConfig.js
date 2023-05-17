import React from 'react';

// component
import Iconify from '../../components/Iconify';

// ----------------------------------------------------------------------

const getIcon = (name) => <Iconify icon={name} width={22} height={22} />;

const navConfig = [
  {
    title: 'Dashboard',
    path: '/',
    icon: getIcon('eva:pie-chart-2-fill'),
    endMatch: true
  },
  {
    title: 'Projects',
    path: '/projects',
    icon: getIcon('mdi:engine'),
    endMatch: false
  },
  {
    title: 'People',
    path: '/people',
    icon: getIcon('eva:people-fill'),
    endMatch: false
  },
  {
    title: 'Links',
    path: '/links',
    icon: getIcon('eva:file-text-fill'),
    endMatch: false
  },
];

export default navConfig;
