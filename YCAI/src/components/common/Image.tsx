import React, {
  useState,
} from 'react';

type PropsObject = Record<string, number | string>;

export interface ImageProps {
  alt?: string;
  className?: string;
  extraImgProps?: PropsObject;
  src: string;
  style?: PropsObject;
  title?: string;
};

type ImageState =
  'loading-default' |
  'loading-anonymous' |
  'failed';

/**
 * A component that behaves exactly like the HTML img tag,
 * except that if it fails to load the image on the first try,
 * it will try again with the "crossorigin" attribute set
 * to "anonymous".
 *
 * The extraImgProps is an object containing props that
 * will be passed to the img tag directly.
 *
 * I chose this order of execution because I think it's more likely that
 * the image will succeed to load on the first try.
 *
 * E.g. YouTube pictures load without the "crossorigin" attribute,
 * while wikipedia images fail to load without it.
 *
 * This is because without the "anonymous" attribute YouTube returns a
 * "cross-origin-resource-policy: cross-origin" header, so it's fine for us,
 * while wikipedia returns a "access-control-allow-origin: *" header, which
 * triggers an error unless we send an "origin" header with the request.
 *
 * And we cannot just blindly set "crossorigin = 'anonymous'" because
 * if we do that, the image will fail to load from servers where this
 * is not needed.
 */
const Image: React.FC<ImageProps> = (props) => {
  const [state, setState] = useState<ImageState>('loading-default');

  const {extraImgProps, ...imgProps} = props;

  const onError: () => void = () => {
    if (state === 'loading-default') {
      // if the image did not load the normal way,
      // try again with the cross-origin attribute
      // set to "anonymous"
      setState('loading-anonymous');
    } else {
      // if we get an error on the second try,
      // the image is not available or not accessible,
      // we give up
      setState('failed');
    }
  };

  // the crossOrigin prop depending on the state
  const crossOrigin = state === 'loading-anonymous'
    ? 'anonymous' : undefined;

  return (
    <img
      {...imgProps}
      {...(extraImgProps ?? {})}
      onError={onError}
      crossOrigin={crossOrigin}
    />
  );
};

export default Image;
