'use babel';

/* eslint-disable import/no-unresolved, no-loop-func  */
/* global atom */

import { CompositeDisposable } from 'atom';
import { screen } from 'electron';
import uuid from 'uuid';
import EditorHandler from './editor-handler';
import DistanceBarView from './distance-bar-view';
import XmlWriter from './xml-writer';

let initState = false;

module.exports = {
  subscriptions: null,
  editorHandler: new EditorHandler(),
  activate() {
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(
      atom.commands.add('atom-workspace', {
        'iTrace-atom:init': () => {
          // prevents init form being called mulitple times
          if (initState === false) {
            initState = true;
            console.log('Init');

            this.openXML();
            this.distanceBar();

            // menu logic
            atom.menu.add([
              {
                label: 'iTrace Atom',
                submenu: [
                  { type: 'separator' },
                  {
                    label: 'Start Tracking',
                    command: 'iTrace-atom:start-tracking-mouse',
                    enabled: true
                  },
                  {
                    label: 'Stop Tracking',
                    command: 'iTrace-atom:stop-tracking-mouse',
                    enabled: false
                  },
                  {
                    label: 'Toggle Highlighting',
                    command: 'iTrace-atom:toggle-highlighting',
                    enabled: true
                  }
                ]
              }
            ]);
          }
        }
      })
    );

    this.subscriptions.add(
      atom.commands.add('atom-workspace', {
        'iTrace-atom:start-tracking-mouse': () => {
          this.startTrackingMouse();
          console.log('start tracking');

          // menu logic
          atom.menu.add([
            {
              label: 'iTrace Atom',
              submenu: [
                {
                  label: 'Start Tracking',
                  command: 'iTrace-atom:start-tracking-mouse',
                  enabled: false
                },
                {
                  label: 'Stop Tracking',
                  command: 'iTrace-atom:stop-tracking-mouse',
                  enabled: true
                }
              ]
            }
          ]);
        }
      })
    );

    this.subscriptions.add(
      atom.commands.add('atom-workspace', {
        'iTrace-atom:stop-tracking-mouse': () => {
          this.stopTrackingMouse();
          console.log('stop tracking');

          // menu logic
          atom.menu.add([
            {
              label: 'iTrace Atom',
              submenu: [
                {
                  label: 'Start Tracking',
                  command: 'iTrace-atom:start-tracking-mouse',
                  enabled: true
                },
                {
                  label: 'Stop Tracking',
                  command: 'iTrace-atom:stop-tracking-mouse',
                  enabled: false
                }
              ]
            }
          ]);
        }
      })
    );

    this.subscriptions.add(
      atom.commands.add('atom-workspace', {
        'iTrace-atom:toggle-highlighting': () => {
          this.editorHandler.toggleHighlighting();
          this.editorHandler.track();
          console.log('toggle highlighting');
        }
      })
    );
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  openXML() {
    const { bounds } = this.editorHandler.getScreenProperties();
    this.XmlWriter = new XmlWriter('', bounds.width, bounds.height);
  },

  distanceBar() {
    const statusBar = atom.workspace.getFooterPanels()[0].item;
    const distanceView = new DistanceBarView('orange');
    statusBar.addRightTile({ item: distanceView, priority: 202 });
    // const distanceColor = this.editorHandler.someColorFunction(someDistanceData);
    // distanceView.changeColor(distanceColor);
  },

  /*
  Tracks Mouse indefinitely
  This will be obselete when socket is set up.
  */
  startTrackingMouse() {
    atom.workspace.element.addEventListener('mousemove', () => {
      const cursorPos = screen.getCursorScreenPoint();
      let position = this.editorHandler.getLineColumn(cursorPos);
      if (position === undefined) {
        position = {
          row: -1,
          column: -1
        };
      }
      const gaze = {
        id: uuid(),
        event_id: uuid(),
        x: cursorPos.x,
        y: cursorPos.y,
        row: position.row,
        column: position.column,
        filename: this.editorHandler.getFileName(),
        language: this.editorHandler.getLanguageType(),
        font_size: this.editorHandler.getFontSize(),
        line_height: this.editorHandler.getLineHeight(),
        token: position.row === -1 ? undefined : this.editorHandler.getToken(position)
      };
      this.XmlWriter.writeGaze(gaze);
    });
  },

  stopTrackingMouse() {
    const tempFile = "C:/output.xml";
    this.XmlWriter.writeToFile(tempFile);
  }
};
