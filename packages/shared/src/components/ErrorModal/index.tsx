import React from 'react';
import ReportProblemRoundedIcon from '@mui/icons-material/ReportProblemRounded';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import clsx from 'clsx';
import './errorModal.css';
import { Box, Button, Typography } from '@material-ui/core';

export interface ErrorModalProps {
  name: string;
  message: string;
  details: string[];
  onClick: (action: string) => void;
}

const ErrorModal = (props: Props): JSX.Element => {
  const { name, message, details, onClick } = props;
  const [detailsShown, setDetailsShown] = React.useState(false);
  const handleDetailsClick = (): void => {
    setDetailsShown((prev) => !prev);
  };
  const handleDismiss = (): void => {
    onClick('!');
  };

  return (
    <Box className="ErrorModal">
      <div className="ErrorModal__container">
        <div className="ErrorModal__container__name">
          <ReportProblemRoundedIcon />
          <Typography variant="h5">{name}</Typography>
        </div>
        <Typography className="ErrorModal__container__message">
          {message}
        </Typography>
        <div className="ErrorModal__container__details">
          <Button
            className="ErrorModal__container__details__btn"
            onClick={handleDetailsClick}
          >
            Details
            <ArrowForwardIosIcon
              className={clsx('ErrorModal__container__details__btn__icon', {
                '-showBox': detailsShown,
              })}
            />
          </Button>
          <div
            className={clsx('ErrorModal__container__details__box', {
              '-showBox': detailsShown,
            })}
          >
            <ul className="ErrorModal__container__details__box__detail">
              {details.map((d) => (
                <li key={d}>
                  <Typography>{d}</Typography>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="ErrorModal__close">
          <button onClick={handleDismiss}>Dismiss</button>
        </div>
      </div>
    </Box>
  );
};

export default ErrorModal;
