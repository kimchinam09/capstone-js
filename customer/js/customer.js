import { CART_STORAGE_KEY } from "../../assets/js/constants.js";
import Cart from "../../assets/js/models/Cart.js";
import { productService } from "../../assets/js/services/ProductService.js";
import { escapeHtml, formatCurrency } from "../../assets/js/utils/formatters.js";

const elements = {
  productList: document.querySelector("#productList"),
  productStatus: document.querySelector("#productStatus"),
  typeFilter: document.querySelector("#typeFilter"),
  cartPanel: document.querySelector("#cartPanel"),
  cartOverlay: document.querySelector("#cartOverlay"),
  cartBody: document.querySelector("#cartBody"),
  cartCount: document.querySelector("#cartCount"),
  cartTotal: document.querySelector("#cartTotal"),
  openCartButton: document.querySelector("#openCartButton"),
  closeCartButton: document.querySelector("#closeCartButton"),
  checkoutButton: document.querySelector("#checkoutButton"),
  toast: document.querySelector("#toast"),
};

let products = [];
let toastTimer;

function loadCart() {
  try {
    const savedCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) ?? [];
    return new Cart(Array.isArray(savedCart) ? savedCart : []);
  } catch (error) {
    // Nếu localStorage hỏng, trả về giỏ rỗng để trang vẫn hoạt động bình thường.
    console.warn("Không thể đọc giỏ hàng đã lưu:", error);
    return new Cart();
  }
}

const cart = loadCart();

function saveCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart.items));
}

function showToast(message, type = "success") {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.className = `toast show ${type}`;
  toastTimer = setTimeout(() => elements.toast.classList.remove("show"), 2500);
}

function renderProducts(productList) {
  if (!productList.length) {
    elements.productList.innerHTML = "";
    elements.productStatus.textContent = "Không tìm thấy sản phẩm phù hợp.";
    elements.productStatus.hidden = false;
    return;
  }

  elements.productStatus.hidden = true;
  elements.productList.innerHTML = productList
    .map(
      (product) => `
        <article class="product-card">
          <div class="product-image-wrap">
            <span class="product-badge">${escapeHtml(product.type)}</span>
            <img
              class="product-image"
              src="${escapeHtml(product.img)}"
              alt="${escapeHtml(product.name)}"
              loading="lazy"
            />
          </div>
          <div class="product-content">
            <p class="product-type">${escapeHtml(product.type)}</p>
            <h3>${escapeHtml(product.name)}</h3>
            <p class="product-description">${escapeHtml(product.desc)}</p>
            <ul class="product-specs">
              <li><strong>Màn hình:</strong> ${escapeHtml(product.screen)}</li>
              <li><strong>Camera sau:</strong> ${escapeHtml(product.backCamera)}</li>
              <li><strong>Camera trước:</strong> ${escapeHtml(product.frontCamera)}</li>
            </ul>
            <div class="product-bottom">
              <strong class="product-price">${formatCurrency(product.price)}</strong>
              <button class="button button-primary add-to-cart" type="button" data-product-id="${escapeHtml(product.id)}">
                Thêm vào giỏ
              </button>
            </div>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderCart() {
  elements.cartCount.textContent = cart.totalQuantity;
  elements.cartTotal.textContent = formatCurrency(cart.totalPrice);
  elements.checkoutButton.disabled = cart.items.length === 0;

  if (!cart.items.length) {
    elements.cartBody.innerHTML = `
      <div class="empty-cart">
        <span aria-hidden="true">🛍️</span>
        <h3>Giỏ hàng đang trống</h3>
        <p>Hãy chọn một sản phẩm bạn yêu thích.</p>
      </div>
    `;
    return;
  }

  elements.cartBody.innerHTML = cart.items
    .map(
      (item) => `
        <article class="cart-item">
          <img src="${escapeHtml(item.product.img)}" alt="${escapeHtml(item.product.name)}" />
          <div class="cart-item-info">
            <h3>${escapeHtml(item.product.name)}</h3>
            <p>${formatCurrency(item.product.price)}</p>
            <div class="quantity-control" aria-label="Số lượng ${escapeHtml(item.product.name)}">
              <button type="button" data-cart-action="decrease" data-product-id="${escapeHtml(item.product.id)}" aria-label="Giảm số lượng">−</button>
              <span>${item.quantity}</span>
              <button type="button" data-cart-action="increase" data-product-id="${escapeHtml(item.product.id)}" aria-label="Tăng số lượng">+</button>
            </div>
          </div>
          <div class="cart-item-side">
            <button class="remove-button" type="button" data-cart-action="remove" data-product-id="${escapeHtml(item.product.id)}">Xóa</button>
            <strong>${formatCurrency(item.subtotal)}</strong>
          </div>
        </article>
      `,
    )
    .join("");
}

function updateCart() {
  saveCart();
  renderCart();
}

function openCart() {
  elements.cartOverlay.hidden = false;
  elements.cartPanel.classList.add("open");
  elements.cartPanel.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
}

function closeCart() {
  elements.cartPanel.classList.remove("open");
  elements.cartPanel.setAttribute("aria-hidden", "true");
  elements.cartOverlay.hidden = true;
  document.body.classList.remove("no-scroll");
}

elements.typeFilter.addEventListener("change", (event) => {
  const selectedType = event.target.value;
  const filteredProducts = selectedType === "all"
    ? products
    : products.filter((product) => product.type === selectedType);

  renderProducts(filteredProducts);
});

// Event delegation giúp danh sách sản phẩm có thể render lại mà không cần gắn lại từng sự kiện.
elements.productList.addEventListener("click", (event) => {
  const button = event.target.closest(".add-to-cart");
  if (!button) return;

  const product = products.find((item) => item.id === button.dataset.productId);
  if (!product) return;

  cart.add(product);
  updateCart();
  showToast(`Đã thêm ${product.name} vào giỏ.`);
});

elements.cartBody.addEventListener("click", (event) => {
  const button = event.target.closest("[data-cart-action]");
  if (!button) return;

  const { cartAction, productId } = button.dataset;
  if (cartAction === "increase") cart.updateQuantity(productId, 1);
  if (cartAction === "decrease") cart.updateQuantity(productId, -1);
  if (cartAction === "remove") cart.remove(productId);
  updateCart();
});

elements.openCartButton.addEventListener("click", openCart);
elements.closeCartButton.addEventListener("click", closeCart);
elements.cartOverlay.addEventListener("click", closeCart);

elements.checkoutButton.addEventListener("click", () => {
  if (!cart.items.length) return;
  cart.clear();
  updateCart();
  closeCart();
  showToast("Thanh toán thành công. Cảm ơn bạn!");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && elements.cartPanel.classList.contains("open")) closeCart();
});

async function init() {
  renderCart();

  try {
    const apiProducts = await productService.getAll();
    const validTypes = ['samsung', 'iphone'];
    products = apiProducts.filter(
      (product) => validTypes.includes(product.type) && product.price > 0 && /^https?:\/\//i.test(product.img),
    );

    renderProducts(products);
  } catch (error) {
    console.error('Lỗi lấy danh sách sản phẩm:', error);
    products = [];
    renderProducts(products);
    showToast('Không thể kết nối API. Vui lòng thử lại sau.', 'error');
  }
}

init();
