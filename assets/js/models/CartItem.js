import Product from "./Product.js";

export default class CartItem {
  constructor(product, quantity = 1) {
    this.product = product instanceof Product ? product : new Product(product);
    this.quantity = Number(quantity) > 0 ? Number(quantity) : 1;
  }

  get subtotal() {
    return this.product.price * this.quantity;
  }
}

