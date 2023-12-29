import { Component } from '../component';
import html from './hints.tpl.html';

class Hints extends Component {
  async render() {
    // выполняем запрос подсказок по апи и отрисовываем их
    const hintsResp = await fetch(`/api/getHints`);
    const {firstHint, secondHint, thirdHint} = await hintsResp.json();

    this.view.firstHint.innerText = firstHint;
    this.view.secondHint.innerText = secondHint;
    this.view.thirdHint.innerText = thirdHint;
  }
}

export const hintsComp = new Hints(html);
