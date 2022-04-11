import {
  AppBar, Avatar, Box, Button, Divider, Popover, Toolbar, Typography
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/AddOutlined';
import SettingsIcon from '@material-ui/icons/Settings';
import * as React from 'react';
import { GuardoniConfigRequired } from '../../guardoni/types';
import TKLogo from './icons/TKLogo';
import YTLogo from './icons/YTLogo';
import AdvancedSettingModal from './modals/AdvancedSettingModal';

interface LayoutProps {
  config: GuardoniConfigRequired;
  onConfigChange: (c: GuardoniConfigRequired) => void;
}

const Layout: React.FC<LayoutProps> = ({
  config,
  onConfigChange,
  children,
}) => {
  const popoverId = 'header-popover';
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const [advancedSettingDialogOpen, setAdvancedSettingDialogOpen] =
    React.useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <AppBar position="static">
        <Toolbar>
          <Box>
            <Typography variant="h3">Guardoni</Typography>
            <Typography variant="caption">
              v{process.env.VERSION} - {process.env.NODE_ENV}
            </Typography>
          </Box>
          <Box
            style={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end' }}
          >
            <div style={{ padding: 10 }}>
              <YTLogo />
            </div>
            <div style={{ padding: 10 }}>
              <TKLogo />
            </div>
          </Box>
          <Box>
            <Avatar
              src="GG"
              aria-describedby={popoverId}
              onClick={() => setPopoverOpen(true)}
            />
            <Popover
              id={popoverId}
              open={popoverOpen}
              style={{
                top: 40,
              }}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              onClick={() => {
                setPopoverOpen(false);
              }}
            >
              <Box
                style={{
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <Avatar alt="GG" />
                <Typography>Profile Name</Typography>
                <Typography>{config.profileName}</Typography>
                <Divider />
                <Button startIcon={<AddIcon />}>Add profile</Button>
                <Button
                  startIcon={<SettingsIcon />}
                  onClick={() => {
                    setAdvancedSettingDialogOpen(true);
                  }}
                >
                  Advanced settings
                </Button>
                <Button startIcon={<AddIcon />}>Privacy Policy</Button>
              </Box>
            </Popover>
          </Box>
        </Toolbar>
      </AppBar>
      <div style={{ height: '100%' }}>
        {children}
        <AdvancedSettingModal
          open={advancedSettingDialogOpen}
          config={config}
          onConfigChange={onConfigChange}
          onSubmit={() => {}}
          onCancel={() => {
            setAdvancedSettingDialogOpen(false);
          }}
        />
      </div>
    </div>
  );
};

export default Layout;
