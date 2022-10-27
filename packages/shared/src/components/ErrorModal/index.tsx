import React from 'react';
import ReportProblemRoundedIcon from '@mui/icons-material/ReportProblemRounded';
import './errorModal.css';

interface Props {
  name: string;
  message: string;
  details: string[];
}

const ErrorModal = (props: Props): JSX.Element => {
  const { name, message, details } = props;
  return (
    <div className="ErrorModal">
      <div className="ErrorModal__container">
        <div className="ErrorModal__container__name">
          <ReportProblemRoundedIcon />
          <div>{name}</div>
        </div>
        <div className="ErrorModal__container__message">{message}</div>
        <div className="ErrorModal__container__details">{details}</div>
        <div className="ErrorModal__close">
          <button>Dismiss</button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
