import './i18n';
import { ThemeProvider } from '@material-ui/styles';
import React from 'react';
import ReactDOM from 'react-dom';
import { Dashboard } from './components/dashboard/Dashboard';
import reportWebVitals from './reportWebVitals';
import { YCAITheme } from './theme';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider theme={YCAITheme}>
      <DndProvider backend={HTML5Backend}>
        <Dashboard />
      </DndProvider>
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById('ycai')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
void reportWebVitals();
