'use babel';

import uuid from 'uuid';
import fs from 'fs';
import EditorHandler from './editor-handler';
import XmlWriter from './xml-writer';
import { Console } from 'console';

export default class LoggingSession {

  constructor(filepath, timestampString = Date.now()) {
    this._editorHandler = new EditorHandler();
    this._baseFilepath = filepath;
    this.languageType = this._editorHandler.getLanguageType();
    this.font_size = this._editorHandler.getFontSize(),
    this.line_height = this._editorHandler.getLineHeight()
    this.startTime = 0;
    const filename = this._editorHandler.getFileName();
    const sourceExt = filename.substring(filename.lastIndexOf('.')) || '.txt';
    const source = filename
      .split('.')
      .slice(0, -1)
      .join('.');

    const fileOutputBasePath =
      filepath +
      (filepath[filepath.length - 1] === '/' || filepath[filepath.length - 1] === '\\' ? '' : '\\');

    this._baseFilePathWithFolder = fileOutputBasePath;
    this._gazeFilePath = `${fileOutputBasePath}gazeOutput-${timestampString}.xml`;
    this._originalSourceFilePath = `${fileOutputBasePath}sourceOutput-${source}-${timestampString}${sourceExt}`;
    this._modifiedSourceFilePath = `${fileOutputBasePath}modifiedSourceFile-${timestampString}${sourceExt}`;
    this._changeLogFilePath = `${fileOutputBasePath}changeLog-${timestampString}.json`;
    this._timingsFilePath = `${fileOutputBasePath}timings.csv`;

    const sp = this._editorHandler.getScreenProperties();
    this._xmlwriter = new XmlWriter(
      this._gazeFilePath,
      sp.bounds.width * sp.scaleFactor,
      sp.bounds.height * sp.scaleFactor,
      timestampString
    );

    // static strings for streaming JSON edit log to file
    this._editLogType = {
      Insert: 'insert',
      Delete: 'delete'
    };
    this._editLogJSONPrefix = '{"log":[';
    // put an empty object at the end to prevent issues with commas in JSON formatting
    this._editLogJSONSuffix = '{} ]}';
    this._getEditLogEntryStringJSON = function(logObject) {
      return `${JSON.stringify(logObject)}, `;
    };

    // write start of edit log file
    fs.writeFile(this._changeLogFilePath, this._editLogJSONPrefix, err => {
      if (err) throw err;
    });

    fs.writeFile(this._timingsFilePath, '', err => {
      if (err) throw err;
    });

    this._sessionActive = false;
  }

  logPoint(x, y, eventId, log_time_ms) {
    var startTime = performance.now();
    if (this._sessionActive) {
      var position = this._editorHandler.getLineColumn({ x, y });
      const gaze = {
        eventId,
        x,
        y,
        row: position.row,
        column: position.column,
        filename: this.filename,
        language: this.languageType, //cant change after init
        font_size: this.font_size, //cant change after init
        line_height: this.line_height, //cant change after init
        pluginTime: log_time_ms
      };

      this.writeGaze(gaze);

      var endTime = performance.now();
      fs.appendFile(this._timingsFilePath, (endTime - startTime).toFixed(4) + "\n", function(err) {
        if (err) throw err;
      });
    }

  }

  async writeGaze(gaze){

    this._xmlwriter.writeGaze(gaze);
  }

  startTrackingDocumentChanges() {
    const _loggingSession = this;
    _loggingSession.changeHandlerDisposable = _loggingSession._textBuffer.onDidChange(function(
      event
    ) {
      const ts = Date.now();

      // Range {start: Point, end: Point} end: Point {row: 6, column: 0}start: Point {row: 6, column: 0}
      const oldRangeStartOffset = _loggingSession._textBuffer.characterIndexForPosition(
        event.oldRange.start
      );
      const oldRangeEndOffset = _loggingSession._textBuffer.characterIndexForPosition(
        event.oldRange.end
      );
      const newRangeStartOffset = _loggingSession._textBuffer.characterIndexForPosition(
        event.newRange.start
      );
      const newRangeEndOffset = _loggingSession._textBuffer.characterIndexForPosition(
        event.newRange.end
      );
      const oldRangeLen = oldRangeEndOffset - oldRangeStartOffset;
      const newRangeLen = newRangeEndOffset - newRangeStartOffset;

      const { newText } = event;
      const { oldText } = event;

      // if yes then insert, else its a delete
      if (newRangeLen > oldRangeLen) {
        var editLogObject = {
          type: _loggingSession._editLogType.Insert,
          offset: oldRangeStartOffset,
          text: newText,
          len: newText.length,
          timestamp: ts,
          row: event.oldRange.start.row,
          col: event.oldRange.start.column
        };
      } else {
        var editLogObject = {
          type: _loggingSession._editLogType.Delete,
          offset: oldRangeStartOffset,
          text: oldText,
          len: oldText.length,
          timestamp: ts,
          row: event.oldRange.start.row,
          col: event.oldRange.start.column
        };
      }

      const logEntryStr = _loggingSession._getEditLogEntryStringJSON(editLogObject);

      // write start of edit log file
      fs.appendFileSync(_loggingSession._changeLogFilePath, logEntryStr, err => {
        if (err) throw err;
      });
    });
  }

  stopTrackingDocumentChanges() {
    this.changeHandlerDisposable.dispose();
  }

  startSession(originalSourceFileString = '') {
    const _this = this;

    // initialize editor vars
    const thisEditor = atom.workspace.getActiveTextEditor();
    _this._textBuffer = thisEditor.getBuffer();

    // write source to file
    fs.writeFile(_this._originalSourceFilePath, originalSourceFileString, function(err) {});

    _this.startTrackingDocumentChanges();

    _this._sessionActive = true;
  }

  endSession(modifiedSourceFileString = '') {
    // write modified file to file
    fs.writeFile(this._modifiedSourceFilePath, modifiedSourceFileString, function(err) {});

    this.stopTrackingDocumentChanges();

    // write start of edit log file
    fs.appendFileSync(this._changeLogFilePath, this._editLogJSONSuffix, err => {
      if (err) throw err;
    });

    try {
      this._xmlwriter.endWriting();
      this._sessionActive = false;
      return this._baseFilepath;
    } catch (e) {
      return '';
    }
  }

  getSessionActive() {
    return this._sessionActive;
  }
}
