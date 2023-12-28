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

  async sendRoutingEvent(newUrl: string) {
    this.isActive && this._sendEvent({
      type: 'route',
      payload: {url: newUrl},
      timestamp: new Date().toISOString(),
    });
  }

  async sendViewportEvent(property: any, secretKey: string, timestamp: string) {
    this.isActive && this._sendEvent({
      type: property.log && JSON.stringify(property.log) !== '{}' ? 'viewCardPromo' : 'viewCard',
      payload: Object.assign({secretKey: secretKey}, property),
      timestamp: timestamp,
    });
  }

  async sendCartEvent(property: any) {
    this.isActive && this._sendEvent({
      type: 'addToCart',
      payload: property,
      timestamp: new Date().toISOString(),
    });
  }

  async sendOrderEvent(products: { salePriceU: number, id: number }[]) {
    if (this.isActive) {
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


  addObserver() {
    if (this.isActive) {
      this.products.clear();
      this.observer.disconnect();
    }
  }

  addTracking(productElem: Element | null, product: any) {
    if (this.isActive && productElem) {
      this.products.set(product.id.toString(), product);
      this.observer.observe(productElem);
    }
  }

  private async _sendEvent(event: any) {
    this.isActive && fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(event),
    });
  }

  private async _handler(entries: IntersectionObserverEntry[]) {
    const fetchPromises = entries
      .filter(entry => entry.isIntersecting)
      .map(entry => {
        const timestamp = new Date().toISOString();
        const productProperty = this.products.get((entry.target as HTMLElement).dataset.id);

        if (productProperty) {
          return fetch(`/api/getProductSecretKey?id=${productProperty.id}`)
            .then(res => res.json())
            .then(secretKey => {
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