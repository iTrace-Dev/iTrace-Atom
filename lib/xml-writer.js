'use babel';

/****************************************************************************************************************************
 ****************************
 * @file FILE.EXT
 * 
 * @copyright (C) 2022 i-trace.org
 * 
 * This file is part of iTrace Infrastructure http://www.i-trace.org/.
 * iTrace Infrastructure is free software: you can redistribute it and/or modify it under the terms of the GNU General Public
 * License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later
 * version.
 * 
 * iTrace Infrastructure is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the
 * implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License
 * for more details.
 * 
 * You should have received a copy of the GNU General Public License along with iTrace Infrastructure. If not, see
 * https://www.gnu.org/licenses/.
 ************************************************************************************************************************
 ********************************/

const xmlbuilder = require('xmlbuilder');
import * as fs from 'fs';


/* global document */

export default class XmlWriter {
  constructor(filename, screenWidth, screenHeight, timestampString, session_id) {
    // write file to make sure it exists
    fs.writeFile(filename, '', err => {
      if (err) throw err;
    });

    this.xmlDoc = xmlbuilder.begin(
      {
        writer: {
          pretty: true,
          indent: '    '
        }
      },
      function(chunk) {
        ///instead of appendFileSynch --- data could be written out of order
        //use timestamps for analysis TODO check fixation algorithms
        fs.appendFileSync(filename, chunk, {flag: "a"});
  });

    this.xmlDoc = this.xmlDoc.dec();

    this.docPtr = this.xmlDoc
      .ele('itrace_plugin', { session_id: session_id })
      .ele('environment', {
        screen_width: screenWidth,
        screen_height: screenHeight,
        plugin_type: 'ATOM'
      })
      .up()
      .ele('gazes');
  }

  writeGaze(gaze) {
    const filename = gaze.filename || '';
    const fileext = filename.substring(filename.lastIndexOf('.') + 1);

    this.docPtr
      .ele('response', {
        event_id: gaze.eventId,
        plugin_time: gaze.pluginTime,
        x: gaze.x,
        y: gaze.y,
        gaze_target: filename,
        gaze_target_type: fileext,
        source_file_path: filename,
        source_file_line: gaze.row,
        source_file_col: gaze.column,
        editor_line_height: gaze.font_size,
        editor_font_height: gaze.line_height,
        editor_line_base_x: '',
        editor_line_base_y: ''
      })
      .up();
  }

  endWriting() {
    // close all ending tags
    this.docPtr.end();
  }
}
