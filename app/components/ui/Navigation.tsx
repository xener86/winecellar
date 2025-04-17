// File: app/components/ui/Navigation.tsx
import React from 'react';
import { 
  Breadcrumbs as MUIBreadcrumbs, 
  Typography, 
  Button
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';
import NextLink from 'next/link';

interface BreadcrumbProps {
  currentPage?: string;
  paths?: { name: string; href: string }[];
}

export const Breadcrumbs: React.FC<BreadcrumbProps> = ({ 
  currentPage = "Emplacements",
  paths = [] 
}) => {
  return (
    <MUIBreadcrumbs 
      separator={<NavigateNextIcon fontSize="small" />} 
      aria-label="breadcrumb" 
      sx={{ 
        mb: 3,
        '& .MuiBreadcrumbs-ol': {
          alignItems: 'center'
        }
      }}
    >
      <Button 
        component={Link} 
        href="/" 
        color="inherit" 
        size="small" 
        startIcon={<HomeIcon />}
        sx={{ 
          textTransform: 'none',
          '&:hover': {
            bgcolor: 'action.hover',
          }
        }}
      >
        Accueil
      </Button>

      {paths.map(path => (
        <Button
          key={path.href}
          component={Link}
          href={path.href}
          color="inherit" 
          size="small"
          sx={{ 
            textTransform: 'none',
            '&:hover': {
              bgcolor: 'action.hover',
            }
          }}
        >
          {path.name}
        </Button>
      ))}

      <Typography 
        color="text.primary" 
        sx={{ 
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center' 
        }}
      >
        {currentPage}
      </Typography>
    </MUIBreadcrumbs>
  );
};

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
}

export const Link: React.FC<LinkProps> = ({ href, children, ...props }) => {
  return (
    <NextLink href={href} passHref {...props}>
      {children}
    </NextLink>
  );
};