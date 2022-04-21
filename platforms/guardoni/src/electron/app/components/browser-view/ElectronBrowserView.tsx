/**
 * react-electron-browser-view: A simple wrapper of the Electron BrowserView element to allow it's magical props in React
 *
 * @license MIT
 * @author vantezzen (https://vantezzen.io)
 * @repo https://github.com/vantezzen/react-electron-browser-view
 */
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { camelCase } from 'lodash';
import * as remote from '@electron/remote';
import {
  changableProps,
  events,
  methods,
  props,
  webPreferences,
  resizeEvents,
  elementResizeEvents,
} from './constants';
import { BrowserView } from 'electron';

const win = remote.getCurrentWindow();

// events.forEach((event) => {
//   ElectronBrowserView.propTypes[camelCase(`on-${event}`)] = PropTypes.func;
// });

interface ElectronBrowserViewProps {
  className?: string;
  style?: React.CSSProperties;
  ref: React.RefCallback<BrowserView>;
  src?: string;
  devtools?: boolean;
  webpreferences?: any;
  trackposition?: boolean;
  onDidAttach?: () => void;
}

export default class ElectronBrowserView extends Component<ElectronBrowserViewProps> {
  view: BrowserView | null = null;
  track = false;
  c: HTMLDivElement | null = null;

  componentDidMount(): void {
    const options = {
      webPreferences: this.props.webpreferences || {},
    };

    // Add props to webpreferences
    Object.keys(props).forEach((propName) => {
      if (typeof (this.props as any)[propName] !== 'undefined') {
        if (webPreferences.includes(propName)) {
          options.webPreferences[propName] = (this.props as any)[propName];
        }
      }
    });

    this.view = new remote.BrowserView(options);
    win.addBrowserView(this.view);
    this.updateViewBounds();
    this.view.setAutoResize({
      horizontal: true,
      vertical: true,
      width: true,
      height: true,
    });

    // Add event listener alias to keep compatability
    (this.view as any).addEventListener = this.view.webContents.on;
    void this.view.webContents.loadURL(this.props.src ?? '');
    this.setDevTools(this.props.devtools ?? false);

    if (this.props.onDidAttach) {
      this.props.onDidAttach();
    }

    methods.forEach((method) => {
      (this as any)[method] = (...args: any[]) => {
        return (this.view?.webContents as any)[method](...args);
      };
    });

    // Pass Props to view
    Object.keys(props).forEach((propName) => {
      if (typeof (this.props as any)[propName] !== 'undefined') {
        if ((this as any)[propName]) {
          (this as any)[propName]((this.props as any)[propName]);
        }
      }
    });

    // Connect events to resize view automatically
    resizeEvents.forEach((event) => {
      window.addEventListener(event, () => this.updateViewBounds());
    });

    // Connect our event listeners to update the browser view
    events.forEach((event) => {
      if (!this.view?.webContents.isDestroyed()) {
        this.view?.webContents.on(event as any, (...eventArgs: any[]) => {
          const propName = camelCase(`on-${event}`);

          // Proxy events to listeners we got as props
          if ((this.props as any)[propName]) {
            (this.props as any)[propName](...eventArgs);
          }
        });
      }
    });

    // Get our container Element from the page
    const container = ReactDOM.findDOMNode(this.c);
    elementResizeEvents.forEach((event) => {
      container?.addEventListener(event, () => this.updateViewBounds());
    });

    this.setPositionTracking(!!this.props.trackposition);
  }

  componentWillUnmount(): void {
    resizeEvents.forEach((event) => {
      window.removeEventListener(event, () => this.updateViewBounds());
    });

    if (this.track) {
      clearInterval(this.track as any);
    }

    if (this.view) {
      win.removeBrowserView(this.view);
      (this as any).destroy();
      this.view = null;
    }
  }

  componentDidUpdate(prevProps: ElectronBrowserViewProps): void {
    Object.keys(changableProps).forEach((propName) => {
      if ((this.props as any)[propName] !== (prevProps as any)[propName]) {
        if ((changableProps as any)[propName] === '__USE_ATTR__') {
          (this.view?.webContents as any).setAttribute(
            propName,
            (this.props as any)[propName]
          );
        } else {
          (this.view?.webContents as any)[(changableProps as any)[propName]](
            (this.props as any)[propName]
          );
        }
      }
    });
    this.setDevTools(this.props.devtools ?? false);
    this.updateViewBounds();
    this.setPositionTracking(!!this.props.trackposition);
  }

  setPositionTracking(on: boolean): void {
    if (on && !this.track) {
      this.track = true;
      this.updateViewBounds();
    }
  }

  setDevTools(open: boolean): void {
    if (open && !this.view?.webContents.isDevToolsOpened()) {
      this.view?.webContents.openDevTools();
    } else if (!open && this.view?.webContents.isDevToolsOpened()) {
      this.view.webContents.closeDevTools();
    }
  }

  updateViewBounds(): void {
    // We can only update our view if there is a container element
    if (this.c) {
      // Get our container Element from the page
      const container = ReactDOM.findDOMNode(this.c) as Element | null;

      if (container) {
        const rect = container.getBoundingClientRect();

        // setBounds is only compatible with Integers
        const bounds = {
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };

        this.view?.setBounds(bounds);
      }
    }

    if (this.props.trackposition) {
      window.requestAnimationFrame(() => this.updateViewBounds());
    } else {
      // We are not tracking the position anymore
      this.track = false;
    }
  }

  render(): JSX.Element {
    return (
      <div
        ref={(c) => {
          this.c = c;
        }}
        className={this.props.className ?? ''}
        style={Object.assign(
          {},
          {
            width: '100%',
            height: '100%',
            minHeight: 10,
          },
          this.props.style ?? {}
        )}
      />
    );
  }
}
