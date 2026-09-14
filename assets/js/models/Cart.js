import CartItem from "./CartItem.js";

export default class Cart {
  constructor(items = []) {
    // Khôi phục lại đúng prototype sau khi dữ liệu được đọc từ localStorage.
    this.items = items.map((item) => new CartItem(item.product, item.quantity));
  }

  findIndex(productId) {
    return this.items.findIndex((item) => item.product.id === String(productId));
  }

  add(product) {
    const index = this.findIndex(product.id);

    if (index === -1) {
      this.items.push(new CartItem(product));
      return;
    }

    this.items[index].quantity += 1;
  }

  remove(productId) {
    const index = this.findIndex(productId);
    if (index !== -1) this.items.splice(index, 1);
  }

  updateQuantity(productId, change) {
    const index = this.findIndex(productId);
    if (index === -1) return;

    this.items[index].quantity += change;
    // Số lượng bằng 0 có cùng ý nghĩa với việc người dùng xóa sản phẩm.
    if (this.items[index].quantity <= 0) this.items.splice(index, 1);
  }

  clear() {
    this.items = [];
  }

  get totalQuantity() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  get totalPrice() {
    return this.items.reduce((total, item) => total + item.subtotal, 0);
  }
}

