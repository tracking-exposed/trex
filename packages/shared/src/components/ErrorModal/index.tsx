import React from 'react';
import ReportProblemRoundedIcon from '@mui/icons-material/ReportProblemRounded';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import clsx from 'clsx';
import './errorModal.css';

interface Props {
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
    <div className="ErrorModal">
      <div className="ErrorModal__container">
        <div className="ErrorModal__container__name">
          <ReportProblemRoundedIcon />
          <div>{name}</div>
        </div>
        <div className="ErrorModal__container__message">{message}</div>
        <div className="ErrorModal__container__details">
          <button
            className="ErrorModal__container__details__btn"
            onClick={handleDetailsClick}
          >
            Details
            <ArrowForwardIosIcon
              className={clsx('ErrorModal__container__details__btn__icon', {
                '-showBox': detailsShown,
              })}
            />
          </button>
          <div
            className={clsx('ErrorModal__container__details__box', {
              '-showBox': detailsShown,
            })}
          >
            <div className="ErrorModal__container__details__box__detail">
              {details}
            </div>
          </div>
        </div>
        <div className="ErrorModal__close">
          <button onClick={handleDismiss}>Dismiss</button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
