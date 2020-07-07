'use babel';

/* eslint-disable import/no-unresolved, no-loop-func  */
/* global atom, document */

import { screen } from 'electron';

export default class EditorHandler {
  constructor(highlightTextBool = false) {
    this.highlightTextBool = highlightTextBool;
    this.workspace = atom.workspace;
    this.editor = atom.workspace.getActiveTextEditor();
    this.grammar = this.editor.getGrammar();
    this.screen = screen;
    this.document = document;
    this.marker = this.editor.markScreenRange(this.editor.cursors[0].getCurrentWordBufferRange());
  }

  track(point) {
    if (point) {
      if (this.highlightTextBool) {
        const word = this.getWordAtPosition(point);
        this.highlightText(word.position, this.marker);
      }
    }
  }

  getScreenProperties() {
    return this.screen.getPrimaryDisplay();
  }

  getFileName() {
    return this.editor.buffer.file.getBaseName();
  }

  getFontSize() {
    return this.editor.doubleWidthCharWidth;
  }

  getLineHeight() {
    return this.editor.lineHeightInPixels;
  }

  getLanguageType() {
    return this.grammar.name;
  }

  /*
  Input: {x: Integer, y: Integer} - An x y coordinate
  Output: {row: Integer, column: Integer} - A data structure containing the row
  and column of the given point.
   */
  getLineColumn(point) {
    const { bounds } = this.screen.getPrimaryDisplay();
    const editorWorkingArea = this.screen.getPrimaryDisplay().workAreaSize;
    const overscan = {
      x: bounds.width - editorWorkingArea.width + 8,
      y: bounds.height - editorWorkingArea.height + 8
    };
    const currentElement = this.document.elementFromPoint(
      point.x - overscan.x,
      point.y - overscan.y
    );
    const offsetX = this.calculateOffsetX();
    const columnWidth = this.getColumnWidth();

    let row = null;
    let column = null;
    // console.log('Current Element:', currentElement);
    if (currentElement === null) {
      return undefined;
    }
    // whitespace
    if (currentElement.className === 'line') {
      // console.log('whitespace: ', currentElement );
      row = parseInt(currentElement.getAttribute('data-screen-row'), 10);
      column = Math.floor((point.x - offsetX) / columnWidth);
    }

    // code element of some sort
    if (currentElement.className.includes('syntax')) {
      const line = currentElement.closest('.line');
      // console.log('Current Element:', currentElement);
      // console.log('line: ', line);
      row = parseInt(line.getAttribute('data-screen-row'), 10);
      column = Math.floor((point.x - offsetX) / columnWidth);
      this.track({ row, column });
    }

    // probably looking outside window
    // todo: map all objects
    else {
      return undefined;
    }
    return { row, column };
  }

  toggleHighlighting() {
    this.highlightTextBool = !this.highlightTextBool;
    if (!this.highlightTextBool) {
      this.highlightText(undefined, this.marker);
    }
  }

  /*
  Output: Integer - An integer that is the width in pixels of a column.
  */
  getColumnWidth() {
    return this.workspace.getActiveTextEditor().defaultCharWidth;
  }

  /*
  Output: Integer - Outputs the amout of pixels in the x column that need to be
  accounted for when calculating column number.
  */
  calculateOffsetX() {
    const dockOffset = this.workspace.getLeftDock().element.clientWidth;
    let gutterOffset = 0;

    // get all gutters width
    this.workspace.getActiveTextEditor().gutterContainer.gutters.forEach(gutter => {
      gutterOffset += gutter.element.clientWidth;
    });
    return dockOffset + gutterOffset;
  }

  getToken(position) {
    const bufferPos = this.editor.bufferPositionForScreenPosition(position);
    const token = this.editor.scopeDescriptorForBufferPosition(bufferPos);
    return token.scopes[1];
  }

  /*
  Input: {row: Integer, column: Integer} - A data structure containg a single
  point in the editor.
  Output: {value: String, range: {end: Point, start: Point}} - A data structure
  containg the word and the range of characters it is located at.
  */
  getWordAtPosition(position) {
    const editor = this.workspace.getActiveTextEditor();
    const range = editor.cursors[0].getCurrentWordBufferRange();
    const nonWordChars = [
      ' ',
      '~',
      '!',
      '@',
      '#',
      '$',
      '%',
      '^',
      '&',
      '*',
      '(',
      ')',
      '_',
      '-',
      '=',
      '+',
      '[',
      ']',
      '{',
      '}',
      '|',
      ';',
      '<',
      ',',
      '.',
      '>',
      '/',
      '?',
      ':',
      '`',
      '"',
      "'",
      '\\'
    ];

    // set range to given point
    range.end.column = position.column + 1;
    range.end.row = position.row;
    range.start.column = position.column;
    range.start.row = position.row;
    let text = editor.getTextInRange(range);
    if (nonWordChars.includes(text)) {
      return { value: text, position: range };
    }
    // find end of word
    let i = 0;
    while (!nonWordChars.some(substring => text.includes(substring))) {
      range.end.column += 1;
      text = editor.getTextInRange(range);
      i += 1;
      if (i > 100) {
        range.end.column = position.column + 1;
        break;
      }
    }
    range.end.column -= 1;
    text = editor.getTextInRange(range);

    // find start of word
    i = 0;
    while (!nonWordChars.some(substring => text.includes(substring))) {
      range.start.column -= 1;
      if (range.start.column === -1) break;
      text = editor.getTextInRange(range);
      i += 1;
      if (i > 100) {
        range.start.column = position.column - 1;
        break;
      }
    }
    range.start.column += 1;
    text = editor.getTextInRange(range);
    return { value: text, position: range };
  }

  /*
  Input {Range: Range, marker: marker}
  Given a range and marker this will highlight a range
  */
  highlightText(range, marker) {
    if (range) {
      this.marker.setScreenRange(range);
      this.editor.decorateMarker(marker, {
        type: 'highlight',
        class: 'highlight-text'
      });
    } else {
      this.marker.destroy();
      this.marker = this.editor.markScreenRange(this.editor.cursors[0].getCurrentWordBufferRange());
    }
  }
}