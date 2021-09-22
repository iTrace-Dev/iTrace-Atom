'use babel';

/* eslint-disable import/no-unresolved, no-loop-func  */
/* global atom, document, window */

import electron from 'electron';

export default class EditorHandler {
  setActiveEditor(editor) {
    this.editor = editor;
  }

  setOffsetX(offsetX) {
    this.offsetX = offsetX;
  }
  setColumnWidth(columnWidth) {
    this.columnWidth = columnWidth;
  }

  setGrammar(grammar) {
    this.grammar = grammar;
  }

  setMarker(marker) {
    this.marker = marker;
  }
  constructor() {
    this.workspace = atom.workspace;
    this.editor = atom.workspace.getActiveTextEditor();
    this.grammar = this.editor.getGrammar();

    this.screen = electron.screen || electron.remote.screen;
    this.scaleFactor = this.screen.getPrimaryDisplay().scaleFactor;
    this.bounds = this.screen.getPrimaryDisplay().bounds;
    this.editorWorkingArea = this.screen.getPrimaryDisplay().workAreaSize;
    this.overscan = {
      x: this.bounds.width - this.editorWorkingArea.width - window.screenX,
      y: this.bounds.height - this.editorWorkingArea.height - window.screenY
    };

    this.columnWidth = this.getColumnWidth();
    this.document = document;
    this.marker = this.editor.markScreenRange(this.editor.cursors[0].getCurrentWordBufferRange());

    this.workspace.observeActiveTextEditor(() => {
      this.updateEditor();
    }, atom.workspace.getActiveTextEditor());
  }

  updateEditor() {
    const activeEditor = atom.workspace.getActiveTextEditor();
    this.setActiveEditor(activeEditor);
    const grammar = activeEditor.getGrammar();
    this.setGrammar(grammar);
    const columnWidth = this.getColumnWidth();
    this.setColumnWidth(columnWidth);
    const marker = activeEditor.markScreenRange(
      activeEditor.cursors[0].getCurrentWordBufferRange()
    );
    this.setMarker(marker);
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

  getColumn(actualPoint) {
    this.offsetX = this.calculateOffsetX();
    return Math.floor((actualPoint.x - this.offsetX) / this.columnWidth);
  }

  /*
  Input: {x: Integer, y: Integer} - An x y coordinate
  Output: {row: Integer, column: Integer} - A data structure containing the row
  and column of the given windowPoint.
   */
  getLineColumn(windowPoint) {
    // we need to divide the windowPoint coordinates by the scale factor of the primary display in electron
    const actualPoint = {
      x: windowPoint.x / this.scaleFactor || 0,
      y: windowPoint.y / this.scaleFactor || 0
    };

    let column = this.getColumn(actualPoint);

    const mousePosition = this.editor.component.screenPositionForMouseEvent({
      clientX: windowPoint.x,
      clientY: windowPoint.y
    });

    const bufferPosition = this.editor.bufferPositionForScreenPosition(mousePosition, {
      clipDirection: 'closest'
    });

    let { row } = bufferPosition;

    if (column < 0 || row < 0) {
      row = -1;
      column = -1;
    }

    return { row, column };
  }

  /*
    Output: Integer - An integer that is the width in pixels of a column.
    */
  getColumnWidth() {
    return this.editor.defaultCharWidth;
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
}
