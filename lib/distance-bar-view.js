'use babel';

/* global document */
export default class DistanceBarView {
  constructor(color) {
    this.element = document.createElement('a');
    this.element.classList.add('distance-bar');
    this.element.innerText = 'texttexttext';
    this.element.style.backgroundColor = color;
    this.element.style.color = color;
    this.element.addEventListener('mouseover', this.onMouseOver);
    this.color = color;
  }

  changeColor(color) {
    this.element.style.backgroundColor = color;
    this.element.style.color = color;
    this.color = color;
  }

  onMouseOver() {
    console.log(this.color);
  }
}
