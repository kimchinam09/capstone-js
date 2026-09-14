export default class Product {
  constructor({ id = '', name, price, screen, backCamera, frontCamera, img, desc, type }) {
    this.id = String(id);
    this.name = String(name ?? '');
    const parsedPrice = Number(price);
    this.price = Number.isFinite(parsedPrice) ? parsedPrice : 0;
    this.screen = String(screen ?? '');
    this.backCamera = String(backCamera ?? '');
    this.frontCamera = String(frontCamera ?? '');
    this.img = String(img ?? '');
    this.desc = String(desc ?? '');
    // Chuẩn hóa loại để lọc đúng dù API trả về iphone hoặc Iphone.
    this.type = String(type ?? '').trim().toLowerCase();
  }

  // MockAPI tự sinh id khi thêm mới nên payload không cần gửi id lên server.
  toPayload() {
    return {
      name: this.name.trim(),
      price: this.price,
      screen: this.screen.trim(),
      backCamera: this.backCamera.trim(),
      frontCamera: this.frontCamera.trim(),
      img: this.img.trim(),
      desc: this.desc.trim(),
      type: this.type,
    };
  }
}
