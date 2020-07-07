'use babel';

/* global WebSocket, document, CustomEvent */

/*
SocketHandler controls communication from core
*/
export default class SocketHandler {
  constructor(websocket = 'ws://localhost:7007') {
    this.data = [];
    this.status = false;
    this.socket = new WebSocket(websocket);
    this.socket.onopen = () => {
      // console.log('Socket connected');
      this.socket.send('connection established');
      this.setStatus(true);
      this.requestSession();
    };
    this.socket.onmessage = event => {
      const eventArguments = event.data.trim().split(',');
      var JsonData;
      if(eventArguments[0] == "session_start") {
        JsonData = {
          CurrentSessionID: eventArguments[1],
          SessionDateTime: eventArguments[2],
          RootDirectory: eventArguments[3]
        }
      } else if (eventArguments[0] == "session_stop") {
        JsonData = {
          event: "session-end"
        }
      } else if(eventArguments[0] == "gaze") {
        JsonData = {
          EventTime: eventArguments[1],
          X: eventArguments[2],
          Y: eventArguments[3]
        }
      }

      this.setData(JsonData);
    };
    this.socket.onclose = () => {
      // console.log('Connection closed');
      this.setStatus(false);
    };
    this.socket.onerror = error => {
      // console.log(error);
      throw error;
    };
  }

  /* If the data flow needs to be modified to account for speed that can be done
here. This creates an event that sends the data to the main program when recieved. */
  setData(data) {
    this.data = data;
    if (data.CurrentSessionID) {
      const event = new CustomEvent('new-session', { detail: this.data });
      document.dispatchEvent(event);
    } else if (data.event === 'session-end') {
      const event = new CustomEvent('session-end', { detail: this.data });
      document.dispatchEvent(event);
    } else if (data.X) {
      const event = new CustomEvent('new-gaze', { detail: this.data });
      document.dispatchEvent(event);
    } else {
      // console.log('Error invalid data recieved');
    }
  }

  requestSession() {
    console.log('requestSession');
    this.socket.send('requestSession');
  }

  setStatus(status) {
    this.status = status;
    const event = new CustomEvent('socket-status', { detail: this.status });
    document.dispatchEvent(event);
  }

  closeSocket() {
    this.socket.close();
  }
}
