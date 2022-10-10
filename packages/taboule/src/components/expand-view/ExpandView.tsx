import React from 'react';
import './ExpandView.css';
import { getYTVideoURLById } from '@shared/utils/yt.utils';
import { selectedRecommendation } from './../../state/types';
import CloseIcon from '@mui/icons-material/Close';
import ytThumbnail from './../../assets/ytthumb.png';

interface Props {
  isVisible: boolean;
  data: selectedRecommendation[];
  handleHideModal: () => void;
}

const ExpandView = (props: Props): JSX.Element => {
  const { isVisible, data, handleHideModal } = props;
  const recommendedList = data.map((recommendation) => {
    return (
      <li key={recommendation.index} className="expand-view__list__item">
        <a
          className="expand-view__list__item__link"
          target="_blank"
          rel="noreferrer"
          href={getYTVideoURLById(recommendation.videoId)}
        >
          <img
            className="expand-view__list__item__img"
            height="120px"
            src={
              recommendation.thumbnailHref ??
              recommendation.recommendedThumbnail ??
              ytThumbnail
            }
          />

          <div className="expand-view__list__item__text">
            <div className="expand-view__list__item__text__title">
              {recommendation.recommendedTitle ?? recommendation.videoId}
            </div>
            <div className="expand-view__list__item__text">
              {recommendation.recommendedViews && (
                <div className="expand-view__list__item__text__views">
                  {recommendation.recommendedViews} views
                </div>
              )}
            </div>
          </div>
        </a>
      </li>
    );
  });

  return (
    <div className={`expand-view ${isVisible ? 'visible' : ''}`}>
      <ul className="expand-view__list">{recommendedList}</ul>
      <button className="expand-view__close" onClick={handleHideModal}>
        <CloseIcon />
      </button>
    </div>
  );
};

export default ExpandView;
