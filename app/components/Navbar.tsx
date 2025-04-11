'use client';

import React, { useState } from 'react';
import { 
  AppBar, Toolbar, Typography, Button, Box, Avatar, 
  IconButton, Drawer, List, ListItem, ListItemIcon, 
  ListItemText, useTheme, useMediaQuery, Menu, MenuItem, 
  Divider, Tooltip, Collapse
} from '@mui/material';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../utils/supabase';
import WineBarIcon from '@mui/icons-material/WineBar';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SearchIcon from '@mui/icons-material/Search';
import PlaceIcon from '@mui/icons-material/Place';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import InventoryIcon from '@mui/icons-material/Inventory';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import PieChartIcon from '@mui/icons-material/PieChart';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const profileMenuOpen = Boolean(anchorEl);
  const [storageOpen, setStorageOpen] = useState(pathname?.startsWith('/storage'));

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleStorageClick = (event: React.MouseEvent) => {
    if (isMobile) {
      event.preventDefault();
      setStorageOpen(!storageOpen);
    }
  };

  const navItems = [
    { label: 'TABLEAU DE BORD', icon: <DashboardIcon />, path: '/' },
    { label: 'VINS', icon: <SearchIcon />, path: '/wines' },
    { 
      label: 'EMPLACEMENTS', 
      icon: <PlaceIcon />, 
      path: '/storage',
      subItems: [
        { label: 'ÉTAGÈRES', icon: <PlaceIcon />, path: '/storage' },
        { label: 'STOCK', icon: <InventoryIcon />, path: '/storage/stock' },
        { label: 'QR CODES', icon: <QrCode2Icon />, path: '/generate-qr' }


      ]
    },
    { label: 'ACCORDS METS-VINS', icon: <RestaurantIcon />, path: '/food-pairing' },
    { label: 'DÉGUSTATIONS', icon: <LocalBarIcon />, path: '/tasting-notes' },
    { 
      label: 'ANALYSES & SUGGESTIONS', 
      icon: <PieChartIcon />, 
      path: '/insights' 
    },
  ];

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname?.startsWith(path)) return true;
    return false;
  };

  const renderDrawer = (
    <Drawer
      anchor="left"
      open={drawerOpen}
      onClose={toggleDrawer}
      PaperProps={{
        sx: {
          width: 280,
          backgroundColor: '#8B0000',
          color: 'white'
        }
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
        <WineBarIcon sx={{ mr: 1, fontSize: 28 }} />
        <Typography variant="h6" component="div">
          WINECELLAR
        </Typography>
      </Box>
      <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />
      <List sx={{ p: 1 }}>
        {navItems.map((item) => (
          <React.Fragment key={item.path}>
            <ListItem 
              disablePadding 
              component={item.subItems ? 'div' : Link} 
              href={item.subItems ? undefined : item.path}
              onClick={item.subItems ? handleStorageClick : toggleDrawer}
              sx={{ 
                mb: 1,
                borderRadius: 2,
                backgroundColor: isActive(item.path) ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                width: '100%',
                p: 1.5,
                borderRadius: 2
              }}>
                <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label} 
                  primaryTypographyProps={{ 
                    fontSize: 14,
                    fontWeight: isActive(item.path) ? 600 : 400
                  }}
                />
                {item.subItems && (
                  storageOpen ? <ExpandLess /> : <ExpandMore />
                )}
              </Box>
            </ListItem>
            
            {item.subItems && (
              <Collapse in={storageOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.subItems.map(subItem => (
                    <ListItem 
                      key={subItem.path} 
                      disablePadding 
                      component={Link} 
                      href={subItem.path}
                      onClick={toggleDrawer}
                      sx={{ 
                        mb: 1,
                        pl: 4,
                        borderRadius: 2,
                        backgroundColor: isActive(subItem.path) && !isActive(item.path) ? 
                          'rgba(255, 255, 255, 0.2)' : 'transparent',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        }
                      }}
                    >
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        width: '100%',
                        p: 1.5,
                        borderRadius: 2
                      }}>
                        <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                          {subItem.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={subItem.label} 
                          primaryTypographyProps={{ 
                            fontSize: 14,
                            fontWeight: isActive(subItem.path) ? 600 : 400
                          }}
                        />
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>
      <Box sx={{ mt: 'auto', p: 2 }}>
        <Button 
          fullWidth 
          variant="outlined" 
          color="inherit" 
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{ 
            borderColor: 'rgba(255, 255, 255, 0.5)',
            '&:hover': {
              borderColor: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            }
          }}
        >
          Se déconnecter
        </Button>
      </Box>
    </Drawer>
  );

  return (
    <AppBar position="static" sx={{ bgcolor: '#8B0000', boxShadow: 2 }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center">
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={toggleDrawer}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <WineBarIcon sx={{ mr: 1, fontSize: 28 }} />
          <Typography 
            variant="h6" 
            component={Link} 
            href="/" 
            sx={{ 
              textDecoration: 'none', 
              color: 'inherit',
              fontWeight: 600,
              letterSpacing: 1
            }}
          >
            WINECELLAR
          </Typography>
        </Box>
        
        {!isMobile && (
          <Box sx={{ display: 'flex', mx: 4, flexGrow: 1 }}>
            {navItems.map((item) => {
              // Création d'un menu déroulant pour les éléments avec sous-menus
              if (item.subItems) {
                return (
                  <Box key={item.path} sx={{ position: 'relative', display: 'inline-block' }}>
                    <Button 
                      component={Link} 
                      href={item.path} 
                      color="inherit" 
                      startIcon={item.icon}
                      sx={{ 
                        mx: 0.5, 
                        px: 1.5,
                        position: 'relative',
                        overflow: 'hidden',
                        fontWeight: pathname?.startsWith(item.path) ? 600 : 400,
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: 3,
                          backgroundColor: 'white',
                          transform: pathname?.startsWith(item.path) ? 'scaleX(1)' : 'scaleX(0)',
                          transition: 'transform 0.2s ease-in-out',
                          transformOrigin: 'center'
                        },
                        '&:hover::after': {
                          transform: 'scaleX(1)',
                        },
                        '&:hover + .submenu': {
                          display: 'block'
                        }
                      }}
                    >
                      {item.label}
                    </Button>
                    <Box 
                      className="submenu"
                      sx={{ 
                        display: 'none',
                        position: 'absolute',
                        backgroundColor: '#8B0000',
                        minWidth: 160,
                        zIndex: 1,
                        boxShadow: '0px 8px 16px 0px rgba(0,0,0,0.2)',
                        borderRadius: '0 0 4px 4px',
                        '&:hover': {
                          display: 'block'
                        }
                      }}
                    >
                      {item.subItems.map(subItem => (
                        <Button 
                          key={subItem.path}
                          component={Link} 
                          href={subItem.path} 
                          color="inherit" 
                          startIcon={subItem.icon}
                          fullWidth
                          sx={{ 
                            textAlign: 'left',
                            justifyContent: 'flex-start',
                            padding: '10px 16px',
                            borderRadius: 0,
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.1)'
                            }
                          }}
                        >
                          {subItem.label}
                        </Button>
                      ))}
                    </Box>
                  </Box>
                );
              }
              
              // Rendu normal pour les éléments sans sous-menu
              return (
                <Button 
                  key={item.path}
                  component={Link} 
                  href={item.path} 
                  color="inherit" 
                  startIcon={item.icon}
                  sx={{ 
                    mx: 0.5, 
                    px: 1.5,
                    position: 'relative',
                    overflow: 'hidden',
                    fontWeight: isActive(item.path) ? 600 : 400,
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      backgroundColor: 'white',
                      transform: isActive(item.path) ? 'scaleX(1)' : 'scaleX(0)',
                      transition: 'transform 0.2s ease-in-out',
                      transformOrigin: 'center'
                    },
                    '&:hover::after': {
                      transform: 'scaleX(1)',
                    }
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Box>
        )}
        
        <Box>
          <Tooltip title="Profil">
            <IconButton 
              onClick={handleProfileMenuOpen}
              size="small"
              sx={{ 
                ml: 2,
                border: '2px solid white',
                padding: 0.2
              }}
            >
              <Avatar alt="Profil" sx={{ width: 32, height: 32 }} />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={profileMenuOpen}
            onClose={handleProfileMenuClose}
            PaperProps={{
              sx: {
                mt: 1.5,
                borderRadius: 2,
                minWidth: 180,
                boxShadow: 'rgb(255, 255, 255, 0.16) 0px 1px 4px'
              }
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleProfileMenuClose} component={Link} href="/profile">
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Mon profil</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleProfileMenuClose} component={Link} href="/settings">
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Paramètres</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText sx={{ color: theme.palette.error.main }}>
                Déconnexion
              </ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
      {renderDrawer}
    </AppBar>
  );
}