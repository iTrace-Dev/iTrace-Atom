'use babel';

/* global WebSocket, document, CustomEvent */

export default class SocketHandler {
  constructor(websocket = 'ws://localhost:8080') {
    this.data = [];
    this.socket = new WebSocket(websocket);
    this.socket.onopen = () => {
      this.socket.send('connection established');
    };
    this.socket.onmessage = event => {
      this.setData(event);
    };
    this.socket.onclose = () => {
      console.log('Connection closed');
    };
    this.socket.onerror = error => {
      throw error;
    };
  }

  /* If the data flow needs to be modified to account for speed that can be done
here. This creates an event that sends the data to the main program when recieved. */
  setData(data) {
    this.data.push(data);
    const event = new CustomEvent('new-core-message', { data: this.data.shift() });
    document.dispatchEvent(event);
  }
}
