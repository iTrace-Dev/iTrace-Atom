'use babel';
/* eslint-disable import/no-unresolved, no-loop-func  */
/* global atom */
import { CompositeDisposable } from 'atom';
import path from 'path';
import LoggingSession from './logging-session';

import { dialog } from 'electron';

const AppState = {
  Connected: 1,
  Started: 3,
  Stopped: 4,
  Disconnected: 2,
  Locked: 5
};

// socket vars
const net = require('net');

let iTraceSocket = null;

module.exports = {
  subscriptions: null,
  executionbasepath: '',
  activate() {
    const iTraceMenu = atom.menu.template.find(item => {
      return item.label === 'iTrace Atom';
    });
    atom.notifications.addSuccess('Plugin initialized.');

    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(
      atom.commands.add('atom-workspace', {
        'iTrace-atom:connect': () => {
          atom.notifications.addInfo('Connecting to iTrace core...');

          iTraceSocket = new net.Socket();

          // handle connection failure
          let hasInitError = false;

          const ita = this;

          // bind events
          iTraceSocket.on('connect', function(e) {
            atom.notifications.addSuccess('Connected to iTrace Core, Listening for tracking start');

            ita.startListening();

            if (!hasInitError) {
              ita._setMenuState(AppState.Connected);
            }
          });
          iTraceSocket.on('error', function(e) {
            atom.notifications.addError(
              'Error: Unable to connect to iTrace core. Please ensure iTrace Core is running.'
            );

            hasInitError = true;
          });
          iTraceSocket.on('close', function(e) {
            ita.stopListening();
            ita._setMenuState(AppState.Disconnected);
            atom.notifications.addWarning('iTrace Core disconnected.');
          });

          iTraceSocket.connect({
            host: '127.0.0.1',
            port: 8008
          });
        }
      })
    );

    this.subscriptions.add(
      atom.commands.add('atom-workspace', {
        'iTrace-atom:disconnect': () => {
          iTraceSocket.destroy();

          this._setMenuState(AppState.Disconnected);
        }
      })
    );

    this.subscriptions.add(
      atom.commands.add('atom-workspace', {
        'iTrace-atom:help': () => {
          showHelpPrompt();
        }
      })
    );
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  startListening() {
    const ita = this;

    iTraceSocket.on('data', function(data) {
      ita._handleData(ita, data);
    });
  },

  stopListening() {
    const ita = this;

    atom.notifications.addWarning('Stopped logging...');

    if (ita._loggingSession && ita._loggingSession.getSessionActive()) {
      ita._loggingSession.endSession(atom.workspace.getActiveTextEditor().getText());
    }
    this._setMenuState(AppState.Stopped);
  },
  /**
   * @param {module.exports} ita
   * @param {*} data
   */
  async _handleData(ita, data = []) {
    const log_time_ms = Date.now();

    const dataArr = parseAscii(data).split(',');

    // if data starts with a 'session_start', start
    // if data start with a 'session_end', end
    // if data starts with a 'gaze', write a gaze

    if (dataArr[0].indexOf('session_start') >= 0) {
      this._setMenuState(AppState.Started);
      atom.notifications.addSuccess('Logging started by iTrace Core.');
      this.executionbasepath = dataArr[3].substring(0, dataArr[3].indexOf('\n'));
      const path = dataArr[3].substring(0, dataArr[3].indexOf('\n'));
      const fileTimestamp = dataArr[2];
      ita._loggingSession = new LoggingSession(path, fileTimestamp);
      ita._loggingSession.startSession(atom.workspace.getActiveTextEditor().getText());
    } else if (dataArr[0].indexOf('session_end') >= 0) {
      atom.notifications.addInfo('Logging ended by iTrace Core.');
      ita.stopListening();
    } else if (dataArr[0].indexOf('gaze') >= 0 && ita._loggingSession.getSessionActive()) {
      const eventId = dataArr[dataArr.length - 3].trim();
      if (eventId) {
        eventId.trim();
      }
      const x = dataArr[dataArr.length - 2].trim();
      const y = dataArr[dataArr.length - 1].trim();

      this._loggingSession.logPoint(x, y, eventId, log_time_ms);
    }

    function parseAscii(data) {
      let retStr = '';
      for (let i = 0; i < data.length; i++) {
        retStr += String.fromCharCode(data[i]);
      }
      return retStr;
    }
  },

  /**
   * @param {number} appState
   */
  _setMenuState(appState) {
    const iTraceMenu = atom.menu.template.find(item => {
      return item.label === 'iTrace Atom';
    });
    const menuItem_connect = iTraceMenu.submenu[0];
    const menuItem_disconnect = iTraceMenu.submenu[1];
    switch (appState) {
      case AppState.Connected:
        menuItem_connect.enabled = false;
        menuItem_disconnect.enabled = true;
        break;
      case AppState.Disconnected:
        menuItem_connect.enabled = true;
        menuItem_disconnect.enabled = false;
        break;
      case AppState.Stopped:
        break;
      case AppState.Started:
        menuItem_disconnect.enabled = true;
        break;
      case AppState.Locked:
        menuItem_connect.enabled = false;
        menuItem_disconnect.enabled = false;
    }
    atom.menu.update();
  }
};

function showHelpPrompt() {
  const outerDiv = document.createElement('div');

  const steps = document.createElement('ul');
  const step1 = document.createElement('li');
  step1.textContent = 'How to use:';
  const step2 = document.createElement('li');
  step2.textContent = '1: Start iTrace Core application';
  const step3 = document.createElement('li');
  step3.textContent = '2: Configure iTrace Core (session setup output directory, etc)';
  const step4 = document.createElement('li');
  step4.textContent = "3: Click on 'iTrace Atom' menu item in Atom Text Editor";
  const step5 = document.createElement('li');
  step5.textContent = "4: Click 'Connect to iTrace Core', and wait for connection";
  const step6 = document.createElement('li');
  step6.textContent = "5: Click 'Start Tracking' on the iTrace Core application to start logging";
  const step7 = document.createElement('li');
  step7.textContent = "6: Click 'Stop Tracking' on the iTrace Core application to stop logging";
  const step8 = document.createElement('li');
  step8.textContent = '7: Repeat 5-6 for as many logging sessions as needed';
  const step9 = document.createElement('li');
  step9.textContent = 'Output files will be saved in output directory specified in iTrace Core';

  steps.appendChild(step1);
  steps.appendChild(step2);
  steps.appendChild(step3);
  steps.appendChild(step4);
  steps.appendChild(step5);
  steps.appendChild(step6);
  steps.appendChild(step7);
  steps.appendChild(step8);
  steps.appendChild(step9);

  const btnDiv = document.createElement('div');
  btnDiv.style.height = '25px';
  btnDiv.style.marginTop = '15px';

  const continueButton = document.createElement('button');
  continueButton.textContent = 'Ok';
  continueButton.classList.add('btn');
  continueButton.classList.add('btn-success');
  continueButton.style.float = 'right';
  continueButton.style.marginLeft = '5px';

  btnDiv.appendChild(continueButton);

  outerDiv.appendChild(steps);
  outerDiv.appendChild(btnDiv);

  const panel = atom.workspace.addModalPanel({
    item: outerDiv
  });

  panel.show();

  continueButton.addEventListener(
    'click',
    function(e) {
      panel.hide();
    },
    false
  );
}
