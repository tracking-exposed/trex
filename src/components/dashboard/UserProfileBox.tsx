import { ContentCreator } from '@backend/models/ContentCreator';
import { Avatar, Box, Button, Typography } from '@material-ui/core';
import * as QR from 'avenger/lib/QueryResult';
import { declareQueries } from 'avenger/lib/react';
import { sequenceS } from 'fp-ts/lib/Apply';
import { pipe } from 'fp-ts/lib/pipeable';
import * as TE from 'fp-ts/lib/TaskEither';
import { toBrowserError } from 'providers/browser.provider';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { doUpdateCurrentView } from 'utils/location.utils';
import { updateAuth, updateProfile } from '../../state/creator.commands';
import { localProfile } from '../../state/creator.queries';
import { ErrorBox } from '../common/ErrorBox';
import { LazyFullSizeLoader } from '../common/FullSizeLoader';
import { LinkAccountButton } from '../common/LinkAccountButton';

interface LoggedUserProfileBoxProps {
  onLogout: () => void;
  profile: ContentCreator;
}

export const LoggedUserProfileBox: React.FC<LoggedUserProfileBoxProps> = ({
  onLogout,
  profile,
}) => {
  const { t } = useTranslation();

  return (
    <Box display="flex" alignItems="center">
      <Avatar src={profile.avatar} style={{ marginRight: 10 }} />
      <Box display="flex" flexDirection="column" style={{ marginRight: 20 }}>
        <Typography variant="subtitle1">{profile.username}</Typography>
        <Typography variant="caption">{profile.channelId}</Typography>
        <Button
          color="secondary"
          variant="outlined"
          size="small"
          onClick={() => onLogout()}
        >
          {t('actions:unlink_channel')}
        </Button>
      </Box>
    </Box>
  );
};

const withQueries = declareQueries({ profile: localProfile });

export const UserProfileBox = withQueries(({ queries }): React.ReactElement => {
  const handleChannelDelete = React.useCallback(async (): Promise<void> => {
    void pipe(
      sequenceS(TE.ApplicativePar)({
        auth: updateAuth(null),
        profile: updateProfile(null),
      }),
      TE.chainFirst(() =>
        pipe(doUpdateCurrentView({ view: 'index' }), TE.mapLeft(toBrowserError))
      )
    )();
  }, []);

  return pipe(
    queries,
    QR.fold(LazyFullSizeLoader, ErrorBox, ({ profile }) => {
      if (profile === null) {
        return (
          <Box>
            <LinkAccountButton />
          </Box>
        );
      }

      return (
        <LoggedUserProfileBox
          profile={profile}
          onLogout={() => handleChannelDelete()}
        />
      );
    })
  );
});
