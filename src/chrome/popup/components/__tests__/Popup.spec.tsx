import { chrome } from 'jest-chrome';
import * as React from 'react';
import renderer from 'react-test-renderer';
import { Popup } from '../popup';

const onMessageListener = jest.fn().mockImplementation((r, s, sendRes) => {
  sendRes({ active: true });
  return true;
});

describe('Popup', () => {
  test('Should mount the Popup', () => {
    chrome.runtime.onMessage.addListener(onMessageListener);
    const component = renderer.create(<Popup queries={{} as any} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
