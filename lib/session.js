'use babel';

import XmlWriter from './xml-writer';
import EditorHandler from './editor-handler';

const createCsvWriter = require('csv-writer').createObjectCsvWriter;

/* global document */

/* 
Session controls the reading and writing of gaze data coressponding to an indivual session.

Todo: allow a session to be stopped and started again.
*/
export default class Session {
  constructor(sessionData) {
    this.editorHandler = new EditorHandler();
    console.log(sessionData);
    this.sessionId = sessionData.CurrentSessionID;
    this.screenWidth = sessionData.ScreenWidth;
    this.screenHeight = sessionData.screenHeight;
    this.filepath = `${sessionData.RootDirectory}\\iTraceAtom${sessionData.CurrentSessionID}.xml`;
    this.timestampsFilepath = `${sessionData.RootDirectory}\\iTraceAtom${sessionData.CurrentSessionID}_timing.csv`;
    this.xmlWriter = new XmlWriter(this.sessionId, this.screenWidth, this.screenHeight);
    this.timestamps = [];
  }

  /*
  StartSession creates an event listener that listens for new gaze data to be recieved 
  from the socket. 
  */
  startSession() {
    document.addEventListener('new-gaze', event => {
      const recievedTimestamp = Date.now();
      this.writeGaze(event.detail);
      const wroteTimestamp = Date.now();
      this.timestamps.push({
        atomRecieved: recievedTimestamp,
        atomProcessed: wroteTimestamp,
        coreGazeTimestamp: event.detail.SystemTime
      });
    });
  }

  /*
  stopSession ends the session, and outputs the XML file for the session.
  */
  stopSession() {
    this.xmlWriter.writeToFile(this.filepath);
    const csvWriter = createCsvWriter({
      path: this.timestampsFilepath,
      header: [
        { id: 'atomRecieved', title: 'Atom Recieved Timestamp' },
        { id: 'atomProcessed', title: 'Atom Wrote Gaze Timestamp' },
        { id: 'coreGazeTimestamp', title: 'Gaze Timestamp' }
      ]
    });
    csvWriter.writeRecords(this.timestamps);
  }

  /*
  Input: data - a json data object containing information from core
  Collects relevant data and then sends it to XML writer.
  */
  writeGaze(data) {
    const x = Math.round(data.X);
    const y = Math.round(data.Y);
    let position = this.editorHandler.getLineColumn({ x, y });
    if (position === undefined) {
      position = {
        row: -1,
        column: -1
      };
    }
    const gaze = {
      id: this.timestamp,
      event_id: data.EventTime,
      x: data.X,
      y: data.Y,
      row: position.row,
      column: position.column,
      filename: this.editorHandler.getFileName(),
      language: this.editorHandler.getLanguageType(),
      font_size: this.editorHandler.getFontSize(),
      line_height: this.editorHandler.getLineHeight(),
      token_text: this.editorHandler.getWordAtPosition(position).value,
      token_type: position.row === -1 ? undefined : this.editorHandler.getToken(position)
    };
    this.xmlWriter.writeGaze(gaze);
  }

}
