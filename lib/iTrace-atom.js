'use babel';

/* eslint-disable import/no-unresolved, no-loop-func  */
/* global atom document */

/*
This file is the Main file
All functionality is initilized here
And the state of the plugin is also managed here.
*/

import { CompositeDisposable } from 'atom';
import EditorHandler from './editor-handler';
import DistanceBarView from './distance-bar-view';
import SocketHandler from './socket-handler';
import Session from './session';

// global variables
let connectState = false;
let menu;
let distanceBarTile;
let highlightState = false;
let trackingStatus = false;

/* 
Module exports adds commands to the atom workspace. 
*/
module.exports = {
  subscriptions: null,
  editorHandler: new EditorHandler(),
  activate() {
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(
      atom.commands.add('atom-workspace', {
        'iTrace-atom:init': () => {
          this.connectCore();
        }
      })
    );

    this.subscriptions.add(
      atom.commands.add('atom-workspace', {
        'iTrace-atom:toggle-highlighting': () => {
          this.toggleHighlighting();
        }
      })
    );

    this.subscriptions.add(
      atom.commands.add('atom-workspace', {
        'iTrace-atom:disconnect-core': () => {
          this.disconnectCore();
        }
      })
    );
  },

  /* 
  Connects to core application, and adds menu options to start 
  tracking, toggle highlighting, stop tracking, ect.
  */
  connectCore() {
    console.log('Connect to iTrace');
    // prevents init form being called mulitple times
    if (connectState === false) {
      // open socket
      this.socketHandler = new SocketHandler();
      document.addEventListener('new-session', event => {
        this.initSession(event.detail);
        this.startSession();
      });
      document.addEventListener('session-end', () => {
        atom.notifications.addWarning('Tracking Has Stopped');
        atom.notifications.clear();
        this.stopSession();
        this.session = undefined;
      });

      this.distanceBar();
      this.connectionListener();

      // menu logic
      connectState = true;
      menu = atom.menu.add([
        {
          label: 'iTrace',
          submenu: [
            { type: 'separator' },
            {
              label: 'Toggle Highlighting',
              command: 'iTrace-atom:toggle-highlighting',
              enabled: true
            },
            { type: 'separator' },
            {
              label: 'Disconnect from iTrace',
              command: 'iTrace-atom:disconnect-core',
              enabled: true
            }
          ]
        }
      ]);
    }
  },

  /*
  Begin tracking writing Atom data, and update menu to disable start tracking.
  */
  startTracking() {
    console.log('Start Tracking');
    this.startSession();

    if (this.session) {
      // menu logic
      trackingStatus = true;
      atom.menu.add([
        {
          label: 'iTrace',
          submenu: [
            {
              label: 'Disconnect from iTrace',
              command: 'iTrace-atom:disconnect-core',
              enabled: false
            }
          ]
        }
      ]);
    }
  },

  /*
  Finish tracking, write to file, and update menus to disable stop tracking and enable start tracking.
  */
  stopTracking() {
    console.log('Stop Tracking');
    this.stopSession();
    this.socketHandler.requestSession();

    // menu logic
    trackingStatus = false;
    atom.menu.add([
      {
        label: 'iTrace',
        submenu: [
          {
            label: 'Disconnect from iTrace',
            command: 'iTrace-atom:disconnect-core',
            enabled: true
          }
        ]
      }
    ]);
  },

  /*
  Highlights word at recieved X,Y coordinate when enabled. 
  */
  toggleHighlighting() {
    console.log('Toggle Highlighting');
    highlightState = !highlightState;
    document.addEventListener('new-gaze', event => {
      this.editorHandler.findHighlightRange(event, highlightState);
    });
  },

  /*
  Disconnects the socket from core and sets connection to false. 
  */
  disconnectCore() {
    console.log('Disconnect from iTrace');
    if (this.socketHandler.status) {
      this.socketHandler.closeSocket();
    }
    menu.dispose();
    connectState = false;
    distanceBarTile.destroy();
    if (highlightState === true) {
      highlightState = false;
      this.editorHandler.findHighlightRange(null, highlightState);
    }
  },

  /*
  Begins new session if one does not exist currently. 
  */
  initSession(data) {
    if (!this.session) {
      this.session = new Session(data);
    }
  },

  /*
  Starts session which will start loggin data to file.
  */
  startSession() {
    if (!this.session) {
      atom.notifications.addWarning('iTrace Core is not tracking');
      console.log('No valid session found');
    } else {
      console.log('Starting logging');
      this.session.startSession();
    }
  },

  /*
  Stops session and writes data to XML
  */
  stopSession() {
    if (this.session) {
      this.session.stopSession();
      this.session = undefined;
    } else {
      console.log('No valid session');
    }
  },

  /*
  Controlls distance bar informing user if they are too far or too close. 
  */
  distanceBar() {
    const statusBar = atom.workspace.getFooterPanels()[0].item;
    const distanceView = new DistanceBarView();
    distanceBarTile = statusBar.addRightTile({ item: distanceView, priority: 202 });
    document.addEventListener('new-core-message', event => {
      if (event.detail.UserInRange === undefined) {
        distanceView.element.style.backgroundColor = null;
      } else if (event.detail.UserInRange) {
        distanceView.element.style.backgroundColor = 'green';
      } else {
        distanceView.element.style.backgroundColor = 'red';
      }
    });
  },

  /*
  Listens for updates to the socket staus, if connection stops it 
  finilizes the session and resets to a disconnected state. 
  */
  connectionListener() {
    document.addEventListener('socket-status', event => {
      if (!event.detail) {
        if (trackingStatus) {
          this.stopTracking();
        }
        // core never connected
        if (!this.connectState) {
          atom.notifications.addWarning(
            'Could not establish connection to iTrace Core, ensure Core application is running and try again.'
          );
        } else {
          atom.notifications.addWarning('iTrace Core has disconnected');
        }
        this.disconnectCore();
        atom.notifications.clear();
      }
    });
  }
};
