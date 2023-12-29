import localforage from 'localforage';
import { ProductData } from 'types';

const DB = '__wb-favourites';

class FavouritesService {
  init() {
    this._updCounters();
  }

  /**
   * Функция добавления продукта в избранное
   * @param product - добавляемый продукт
   */
  async addProduct(product: ProductData) {
    const products = await this.get();
    await this.set([...products, product]);
  }

  /**
   * Функция удаления продукта из избранного
   * @param product - удаляемый продукт
   */
  async removeProduct(product: ProductData) {
    const products = await this.get();
    await this.set(products.filter(({ id }) => id !== product.id));
  }

  /**
   * Функция удаления всех продуктов из избранного
   */
  async clear() {
    await localforage.removeItem(DB);
    this._updCounters();
  }

  /**
   * Функция получения списка избранных продуктов из localforage
   */
  async get(): Promise<ProductData[]> {
    return (await localforage.getItem(DB)) || [];
  }

  /**
   * Функция записывания списка избранных продуктов в localforage
   * @param data - список продуктов
   */
  async set(data: ProductData[]) {
    await localforage.setItem(DB, data);
    this._updCounters();
  }

  /**
   * Функция проверяющая является ли продукт избранным
   * @param product - проверяемый продукт
   */
  async isInFavourites(product: ProductData) {
    const products = await this.get();
    return products.some(({ id }) => id === product.id);
  }

  /**
   * Функция изменяющая показатели счетчиков
   * @private
   */
  private async _updCounters() {
    const products = await this.get();
    const count = products.length >= 10 ? '9+' : products.length;

    // если счетчик равен 0, убираем ссылку на страницу "Избранное"
    //@ts-ignore
    document.querySelectorAll('.js__favourites').forEach(($el: HTMLElement) => ($el.style.display = count ? 'block' : 'none'));

    //@ts-ignore
    document.querySelectorAll('.js__favourites-counter').forEach(($el: HTMLElement) => ($el.innerText = String(count || '')));
  }
}

export const favouritesService = new FavouritesService();
