import React from 'react';
import clsx from 'clsx';
import styles from './HomepageFeatures.module.css';

interface FeatureItem {
  title: string;
  image: string;
  description: JSX.Element;
  buttons?: JSX.Element;
}

const FeatureList: FeatureItem[] = [
  {
    title: 'Collect the data',
    image: '/img/undraw_docusaurus_mountain.svg',
    description: <>Use the browser extension to collect data from TikTok.</>,
    buttons: (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <a
          className="button button--secondary button--sm"
          style={{ marginRight: 10 }}
          href="https://chrome.google.com/webstore/detail/triktroktrex/bigbeiocbgkhndacjnkklogbilfchijf?hl=it&authuser=0"
        >
          Chrome
        </a>
        <a
          className="button button--secondary button--sm"
          href="https://addons.mozilla.org/en-US/firefox/addon/triktroktrex/"
        >
          firefox
        </a>
      </div>
    ),
  },
  {
    title: 'Run experiments',
    image: '/img/undraw_docusaurus_tree.svg',
    description: (
      <>
        Use our tool <b>guardoni</b> to run experiments with the data collected.
      </>
    ),
  },
  {
    title: 'Explore collected data',
    image: '/img/undraw_docusaurus_react.svg',
    description: (
      <>Collected data are transparent, anonymous and accessible to everyone.</>
    ),
  },
];

function Feature({
  title,
  image,
  buttons,
  description,
}: FeatureItem): JSX.Element {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        {/* <img
          className={styles.featureSvg}
          alt={title}
          src={useBaseUrl(image)}
        /> */}
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {buttons ? <div className="text--center">{buttons}</div> : null}
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
