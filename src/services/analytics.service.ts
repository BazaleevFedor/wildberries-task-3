import {genUUID} from "../utils/helpers";

const url = '/api/sendEvent';
const headers = {'Content-Type': 'application/json'};

class AnalyticsService {
  private isActive: boolean = false;
  private observer = new IntersectionObserver(this._handler.bind(this));
  private products = new Map();

  init() {
    this.isActive = true;
  }

  /**
   * Функция, отправляющая джейсон события роутинга
   * @param newUrl - новый урл
   */
  async sendRoutingEvent(newUrl: string) {
    this.isActive && this._sendEvent({
      type: 'route',
      payload: {url: newUrl},
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Функция, отправляющая джейсон события попадания продукта во вьюпорт
   * @param property - свойства продукта
   * @param secretKey - секретный ключ продукта
   * @param timestamp - время события
   */
  async sendViewportEvent(property: any, secretKey: string, timestamp: string) {
    this.isActive && this._sendEvent({
      type: property.log && JSON.stringify(property.log) !== '{}' ? 'viewCardPromo' : 'viewCard',
      payload: Object.assign({secretKey: secretKey}, property),
      timestamp: timestamp,
    });
  }

  /**
   * Функция, отправляющая джейсон события добавления продукта в корзину
   * @param property - свойства продукта
   */
  async sendCartEvent(property: any) {
    this.isActive && this._sendEvent({
      type: 'addToCart',
      payload: property,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Функция, отправляющая джейсон события оформления заказа
   * @param products - список продуктов в заказе
   */
  async sendOrderEvent(products: { salePriceU: number, id: number }[]) {
    if (this.isActive) {
      // определение общей суммы заказа и список id продуктов
      const { totalPrice, productIds } = products.reduce((acc: { totalPrice: number; productIds: number[] }, product) => {
        acc.totalPrice += product.salePriceU;
        acc.productIds.push(product.id);
        return acc;
      }, { totalPrice: 0, productIds: [] });

      this._sendEvent({
        type: 'purchase',
        payload: {orderId: genUUID(), totalPrice: totalPrice.toString(), productIds: JSON.stringify(productIds)},
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Функция инициализации отслеживания с помощью Intersection Observer
   */
  addObserver() {
    if (this.isActive) {
      this.products.clear();
      this.observer.disconnect();
    }
  }

  /**
   * Функция, добавляющая отслеживаемые элементы Intersection Observer
   * @param productElem - элемент продукта
   * @param product - свойства продукта
   */
  addTracking(productElem: Element | null, product: any) {
    if (this.isActive && productElem) {
      // свойства продукта храним в мапе, чтобы не ходить по апи каждый раз для получения свойст продукта
      this.products.set(product.id.toString(), product);
      this.observer.observe(productElem);
    }
  }

  /**
   * Функция отправки события
   * @param event - событие
   * @private
   */
  private async _sendEvent(event: any) {
    this.isActive && fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(event),
    });
  }

  /**
   * Колбек для отслеживания изменения элементов во вьюпорт Intersection Observer
   * @param entries - отслеживаемые элементы
   * @private
   */
  private async _handler(entries: IntersectionObserverEntry[]) {
    // для ускорения отправки событий, запускаем их асинхронно
    const fetchPromises = entries
      .filter(entry => entry.isIntersecting)  // только те, которые находятся во вьюпорт
      .map(entry => {
        const timestamp = new Date().toISOString();
        const productProperty = this.products.get((entry.target as HTMLElement).dataset.id);

        if (productProperty) {
          return fetch(`/api/getProductSecretKey?id=${productProperty.id}`)
            .then(res => res.json())
            .then(secretKey => {
              // создаем событие появления объекта во вьюпорт
              this.sendViewportEvent(productProperty, secretKey, timestamp);
            });
        } else {
          console.error(`Ошибка поиска параметров продукта:`, entry);
          return Promise.resolve();
        }
      });
    await Promise.all(fetchPromises);
  }
}

export const analyticsService = new AnalyticsService();