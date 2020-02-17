# iTrace Atom

## About
iTrace Atom is a plugin for the [Atom](https://atom.io/) text editor. The plugin will establish a connection to the [iTrace Core](https://github.com/iTrace-Dev/iTrace-Core) desktop application. Once connected to the Core the plugin will accept information from the Core and translate it to editor specific data and output the data to an XML file.

## Installation
1. Install the apm utility. See http://flight-manual.atom.io/getting-started/sections/installing-atom/ if you do not have it installed.

2. Git clone or download to zip file (extract zip file)

3. Navigate to the root folder `iTrace-atom` in the terminal  
Example command:
`cd ./path_to_clone/iTrace-atom`

4. Run the command 'apm link' in a terminal

5. Run the command `npm install` to install required dependencies

5. Restart Atom editor to load the new package

## Features
- Getting line and column from an XY Coordinate
- Getting word at XY Coordinate
- Highlight word at XY Coordinate
- Highlight words at mouse cursor location

## Future Features
- Unit Testing
- Getting token information at XY Coordinate
- Writing token, line, column and valuable data to an XML file
- Ability to send XY coordinates to the plugin Via a socket connection
