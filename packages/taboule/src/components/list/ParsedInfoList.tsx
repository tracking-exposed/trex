import { getYTVideoURLById } from '@shared/utils/yt.utils';
import { ParsedInfo } from '@yttrex/shared/models/metadata/VideoResult';
import * as React from 'react';
import ytThumbnail from './../../assets/ytthumb.png';
import './ParsedInfoList.css';

interface ParsedInfoListProps {
  data: ParsedInfo[];
}

export const ParsedInfoList: React.FC<ParsedInfoListProps> = ({ data }) => {
  const recommendedList = data.map((recommendation) => {
    return (
      <li
        key={recommendation.index ?? recommendation.videoId}
        className="parsed-info__list__item"
      >
        <a
          className="parsed-info__list__item__link"
          target="_blank"
          rel="noreferrer"
          href={
            recommendation.videoId
              ? getYTVideoURLById(recommendation.videoId)
              : ''
          }
        >
          <img
            className="parsed-info__list__item__img"
            height="120px"
            src={
              recommendation.thumbnailHref ??
              recommendation.recommendedThumbnail ??
              ytThumbnail
            }
          />

          <div className="parsed-info__list__item__text">
            <div className="parsed-info__list__item__text__title">
              {recommendation.recommendedTitle ??
                recommendation.title ??
                recommendation.videoId}
            </div>
            <div className="parsed-info__list__item__text">
              {(recommendation.recommendedViews ?? recommendation.views) && (
                <div className="parsed-info__list__item__text__views">
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

  return <ul className="parsed-info__list">{recommendedList}</ul>;
};
