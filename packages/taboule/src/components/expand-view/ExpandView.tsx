import CloseIcon from '@mui/icons-material/Close';
import React from 'react';
import './ExpandView.css';

export interface ExpandViewProps {
  isVisible: boolean;
  onClose: () => void;
}

const ExpandView: React.FC<React.PropsWithChildren<ExpandViewProps>> = ({
  children,
  isVisible,
  onClose,
  ...props
}) => {
  return (
    <div className={`expand-view ${isVisible ? 'visible' : ''}`}>
      {children}
      <button className="expand-view__close" onClick={onClose}>
        <CloseIcon />
      </button>
    </div>
  );
};

export default ExpandView;
