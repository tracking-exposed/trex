import React from 'react';
import './ExpandView.css';
import { getYTVideoURLById } from '@shared/utils/yt.utils';
import { ParsedInfo } from '@yttrex/shared/src/models/Metadata';
import CloseIcon from '@mui/icons-material/Close';
import ytThumbnail from 'assets/ytthumb.png';

interface Props {
  isVisible: boolean;
  data: ParsedInfo[];
  handleHideModal: () => void;
}

const ExpandView = (props: Props): JSX.Element => {
  const { isVisible, data, handleHideModal } = props;
  const recommendedList = data.map((recommendation) => {
    return (
      <li
        key={recommendation.index ?? recommendation.videoId}
        className="expand-view__list__item"
      >
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
              {recommendation.recommendedTitle ??
                recommendation.title ??
                recommendation.videoId}
            </div>
            <div className="expand-view__list__item__text">
              {(recommendation.recommendedViews ?? recommendation.views) && (
                <div className="expand-view__list__item__text__views">
                  {recommendation.recommendedViews ?? recommendation.views}{' '}
                  views
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
