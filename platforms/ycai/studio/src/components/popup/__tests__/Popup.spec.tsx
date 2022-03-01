import React from 'react';

import '../../../i18n';
import { chrome } from 'jest-chrome';
import renderer from 'react-test-renderer';
import { Popup } from '../Popup';

const onMessageListener = jest.fn().mockImplementation((r, s, sendRes) => {
  sendRes({ active: true });
  return true;
});

describe('Popup', () => {
  test('Should mount the Popup', () => {
    chrome.runtime.onMessage.addListener(onMessageListener);
    const component = renderer.create(<Popup />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
