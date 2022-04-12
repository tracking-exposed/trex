import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  makeStyles,
  Popover,
  Toolbar,
  Typography,
  useTheme,
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/AddCircleOutline';
import SettingsIcon from '@material-ui/icons/Settings';
import PolicyIcon from '@material-ui/icons/Policy';
import * as React from 'react';
import { GuardoniConfigRequired } from '../../guardoni/types';
import TKLogo from './icons/TKLogo';
import YTLogo from './icons/YTLogo';
import AdvancedSettingModal from './modals/AdvancedSettingModal';
import cx from 'classnames';

const useStyles = makeStyles((theme) => ({
  platformLogoBox: {
    marginRight: 20,
    display: 'flex',
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  platformLogo: {
    padding: 10,
    opacity: 0.5,
  },
  platformLogoSelected: {
    opacity: 1,
  },
  settingButton: {
    ...theme.typography.subtitle1,
    marginBottom: theme.spacing(2),
  },
}));

export type Platform = 'youtube' | 'tiktok';

export interface HeaderProps {
  config: GuardoniConfigRequired;
  onConfigChange: (c: GuardoniConfigRequired) => void;
  onPlatformChange: (p: Platform) => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  onConfigChange,
  onPlatformChange,
}) => {
  const popoverId = 'header-popover';

  const theme = useTheme();
  const classes = useStyles();
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const [advancedSettingDialogOpen, setAdvancedSettingDialogOpen] =
    React.useState(false);

  return (
    <AppBar position="static">
      <Toolbar>
        <Box>
          <Typography
            variant="h1"
            style={{
              fontSize: theme.spacing(3),
            }}
          >
            Guardoni
          </Typography>
          <Typography variant="caption">
            v{process.env.VERSION} - {process.env.NODE_ENV}
          </Typography>
        </Box>
        <Box className={classes.platformLogoBox}>
          <div
            className={cx(classes.platformLogo, {
              [classes.platformLogoSelected]:
                config.platform.name === 'youtube',
            })}
            onClick={() => onPlatformChange('youtube')}
          >
            <YTLogo />
          </div>
          <div
            className={cx(classes.platformLogo, {
              [classes.platformLogoSelected]: config.platform.name === 'tiktok',
            })}
            onClick={() => onPlatformChange('tiktok')}
          >
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
              top: 50,
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
                minWidth: 400,
              }}
            >
              <Box style={{ marginBottom: theme.spacing(2) }}>
                <Avatar alt="GG" />
              </Box>

              <Typography
                variant="subtitle2"
                style={{
                  marginBottom: theme.spacing(2),
                }}
              >
                Profile Name
              </Typography>
              <Typography>{config.profileName}</Typography>
              <Divider
                style={{
                  width: '100%',
                  background: theme.palette.primary.main,
                  marginTop: theme.spacing(2),
                  marginBottom: theme.spacing(2),
                }}
              />
              <Button
                className={classes.settingButton}
                startIcon={<AddIcon color="primary" />}
              >
                Add profile
              </Button>
              <Button
                className={classes.settingButton}
                startIcon={<SettingsIcon color="primary" />}
                onClick={() => {
                  setAdvancedSettingDialogOpen(true);
                }}
              >
                Advanced settings
              </Button>
              <Button
                className={classes.settingButton}
                startIcon={<PolicyIcon color="primary" />}
              >
                Privacy Policy
              </Button>
            </Box>
          </Popover>
        </Box>
      </Toolbar>
      <AdvancedSettingModal
        open={advancedSettingDialogOpen}
        config={config}
        onConfigChange={onConfigChange}
        onSubmit={() => {}}
        onCancel={() => {
          setAdvancedSettingDialogOpen(false);
        }}
      />
    </AppBar>
  );
};
