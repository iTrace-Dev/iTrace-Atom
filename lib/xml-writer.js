'use babel';

import * as fs from 'fs';
import * as XMLSerializer from 'xmlserializer';
/* global document */

export default class XmlWriter {
  constructor(sessionId, screenWidth, screenHeight) {
    this.data = document.implementation.createDocument(null, 'itrace_atom_plugin');
    const env = this.data.createElement('enviroment');
    const root = this.data.getElementsByTagName('itrace_atom_plugin')[0];
    const gazes = this.data.createElement('gazes');
    env.setAttribute('session_id', sessionId);
    env.setAttribute('screen_width', screenWidth);
    env.setAttribute('screen_height', screenHeight);
    root.appendChild(env);
    root.appendChild(gazes);
  }

  writeGaze(gaze) {
    const gazes = this.data.getElementsByTagName('gazes')[0];
    const gazeResponse = this.data.createElement('gaze');
    gazeResponse.setAttribute('id', gaze.id);
    gazeResponse.setAttribute('event_id', gaze.eventId);
    gazeResponse.setAttribute('x', gaze.x);
    gazeResponse.setAttribute('y', gaze.y);
    gazeResponse.setAttribute('row', gaze.row);
    gazeResponse.setAttribute('column', gaze.column);
    gazeResponse.setAttribute('filename', gaze.filename);
    gazeResponse.setAttribute('language', gaze.language);
    gazeResponse.setAttribute('font_size', gaze.font_size);
    gazeResponse.setAttribute('line_height', gaze.line_height);
    gazeResponse.setAttribute('token', gaze.token);
    gazes.appendChild(gazeResponse);
  }

  writeToFile(filename) {
    const format = require('xml-formatter'); // eslint-disable-line global-require
    const dataString = XMLSerializer.serializeToString(this.data);
    fs.writeFile(filename, format(dataString), err => {
      if (err) throw err;
    });
  }
}
