import React from 'react';
import ReportProblemRoundedIcon from '@mui/icons-material/ReportProblemRounded';
import clsx from 'clsx';
import './errorModal.css';
import { Box, Typography } from '@material-ui/core';
import CloseIcon from '@mui/icons-material/Close';

export interface ErrorModalProps {
  name: string;
  message: string;
  details: string[];
  position?: string[];
  style?: React.CSSProperties;
  onClick: (action: string) => void;
}

const ErrorModal = (props: ErrorModalProps): JSX.Element => {
  const { name, message, details, position, style, onClick } = props;
  const [detailsShown, setDetailsShown] = React.useState(false);

  const handleDetailsClick = (): void => {
    setDetailsShown((prev) => !prev);
  };
  const handleDismiss = (): void => {
    onClick('!');
  };

  return (
    <Box className={`ErrorModal ${position}`} style={style}>
      <div className="ErrorModal__container">
        <div
          className="ErrorModal__container__content"
          onClick={handleDetailsClick}
        >
          <ReportProblemRoundedIcon />
          <Typography className="ErrorModal__container__content__message">
            {name}: {message}
          </Typography>
        </div>
        <div className="ErrorModal__container__details">
          <div
            className={clsx('ErrorModal__container__details__box', {
              '-showBox': detailsShown,
            })}
          >
            <ul className="ErrorModal__container__details__box__detail">
              {details.map((d, i) => (
                <li key={i}>
                  <Typography>{d}</Typography>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <button className="ErrorModal__close" onClick={handleDismiss}>
          <CloseIcon />
        </button>
      </div>
    </Box>
  );
};

export default ErrorModal;
