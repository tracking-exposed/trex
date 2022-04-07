import * as React from 'react';
import {
  Toolbar,
  AppBar,
  Box,
  Typography,
  Avatar,
  Popover,
  Divider,
  Button,
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/AddOutlined';
import SettingsIcon from '@material-ui/icons/Settings';
import { GuardoniConfig } from '../../guardoni/types';
import AdvancedSettingModal from './modals/AdvancedSettingModal';
import YTLogo from './icons/YTLogo';
import TKLogo from './icons/TKLogo';

interface LayoutProps {
  config: GuardoniConfig;
  onConfigChange: (c: GuardoniConfig) => void;
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
          </Box>
          <Popover
            id={popoverId}
            open={popoverOpen}
            style={{
              marginTop: 40,
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
              <Avatar src="GG" />
              <Typography>PublicKey</Typography>
              <Typography>{config.backend}</Typography>
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
        </Toolbar>
      </AppBar>
      <div>
        <div>{children}</div>
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
