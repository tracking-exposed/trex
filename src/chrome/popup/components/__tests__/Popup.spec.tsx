import { compose } from 'avenger';
import * as React from 'react';
import renderer from 'react-test-renderer';
import Popup from '../popup';

describe('Popup', () => {
  test('Should mount the Popup', () => {
    let component = renderer.create(<Popup />);
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();

    // re-rendering
    component = renderer.create(<Popup publicKey={"pub-key"} />);
    tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
