# iTrace Atom

## About
iTrace Atom is a plugin for the [Atom](https://atom.io/) text editor. The plugin will establish a connection to the [iTrace Core](https://github.com/iTrace-Dev/iTrace-Core) desktop application. Once connected to the Core the plugin will accept information from the Core and translate it to editor specific data and output the data to an XML file.

## Installation
1. Install the apm utility. See http://flight-manual.atom.io/getting-started/sections/installing-atom/ if you do not have it installed.

2. Git clone or download to zip file (extract zip file)

3. Navigate to the root folder `iTrace-atom-private` in the terminal  
Example command:
`cd ./path_to_clone/iTrace-atom-private`

4. Run the command 'apm link' in a terminal

5. Run the command `npm install` to install required dependencies

5. Restart Atom editor to load the new package

## How to Use
1. Run atom with the plugin installed

2. Click 'iTrace Atom' in the menu, and click init

3. Start iTrace-Core application on your PC

4. In Atom application, click 'iTrace-Atom', and in the meniu click 'connect to iTrace Core'

5. in iTrace-Core application , setup the environment and pick an output folder

6. In iTrace-Core application, click 'start tracking', and the atom text editor will start tracking automatically

7. When finished, in iTrace-Core applcation click 'stop tracking', and the output files will be saved in the folder specified in the setup step


## Features
- Connection to iTrace-Core application to recieve gaze data
- Resolution of gaze data to line & column numbers within current file
- Outputs 4 files in format described below

## Limitations
- Requires only one document to be visible in the editor (no split window configuration), and on one monitor

## Output Files 
 4 files outputted with names suffixed with the current time
-   gazeOutput_suffix.xml
-   originalSource_suffix.txt
-   modifiedSource_suffix.txt
-   changeLog_suffix.json

## Output Formats

   gazeOutput_suffix.xml
     XML format, tags listed with attributes listed directly

     (Root) 'itrace_plugin' tag: 
         session_id, participant_id

         (Child of Root) 'environment' tag: 
             screen_height (height of environment screen)
             screen_width (width of environment screen)
             plugin_type='ATOM'

         (Child of Root) 'gazes' tag:
             no attributes

             (Child of 'gazes') 'response' tag: (One per gaze event recieved from core)
                 event_id (event id of gaze)
                 plugin_time (time of gaze recorded by plugin in ms)
                 x (x position of gaze)
                 y (y position of gaze)
                 gaze_target (filename of edited file)
                 gaze_target_type (atom determined file type of edited file)
                 source_file_path (path of edited file)
                 source_file_line (0-indexed line number of edited file)
                 source_file_col (0-indexed column number of edited file)
                 editor_line_height (line height of edited file in atom)
                 editor_font_height (font height of edited file in atom)
                 editor_line_base_x = ''
                 editor_line_base_y = ''


   originalSource_suffix
     copy of the source in atom window when logging was started

   modifiedSource_suffix
     copy of the source in atom window when logging was ended

   changeLog_suffix.json
     json-formatted file storing the edit history of the file during the logging session
     
     Format:
         {
             'log': [ //array of many object representing edits
                 {
                     "type": (string) //"insert" or "delete"
                     ,"offset": (number) //absolute offset in file at which event occurred
                     ,"text": (string) //text inserted
                     ,"len": (nunber) //length of deleted or inserted text
                     ,"ts": (number) //timestamp in ms
                     ,"row": (number) //row of change
                     ,"col": (number) //col of change
                 }
             ]
         }
