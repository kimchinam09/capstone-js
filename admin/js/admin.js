import Product from "../../assets/js/models/Product.js";
import { productService } from "../../assets/js/services/ProductService.js";
import { escapeHtml, formatCurrency } from "../../assets/js/utils/formatters.js";
import { validateProduct } from "../../assets/js/utils/validation.js";

const elements = {
  tableBody: document.querySelector("#productTableBody"),
  status: document.querySelector("#adminStatus"),
  summary: document.querySelector("#productSummary"),
  searchInput: document.querySelector("#searchInput"),
  sortSelect: document.querySelector("#sortSelect"),
  addButton: document.querySelector("#addProductButton"),
  modal: document.querySelector("#productModal"),
  modalTitle: document.querySelector("#modalTitle"),
  form: document.querySelector("#productForm"),
  productId: document.querySelector("#productId"),
  saveButton: document.querySelector("#saveProductButton"),
  toast: document.querySelector("#toast"),
};

let products = [];
let toastTimer;

function showToast(message, type = "success") {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.className = `toast show ${type}`;
  toastTimer = setTimeout(() => elements.toast.classList.remove("show"), 2500);
}

function getVisibleProducts() {
  const keyword = elements.searchInput.value.trim().toLowerCase();
  const sortType = elements.sortSelect.value;

  const result = products.filter((product) => product.name.toLowerCase().includes(keyword));

  // Dùng bản sao trước khi sort để không làm thay đổi thứ tự gốc nhận từ API.
  if (sortType === "price-asc") return [...result].sort((a, b) => a.price - b.price);
  if (sortType === "price-desc") return [...result].sort((a, b) => b.price - a.price);
  return result;
}

function renderTable() {
  const visibleProducts = getVisibleProducts();
  elements.summary.textContent = `${visibleProducts.length}/${products.length} sản phẩm đang hiển thị`;

  if (!visibleProducts.length) {
    elements.tableBody.innerHTML = "";
    elements.status.textContent = products.length ? "Không tìm thấy sản phẩm phù hợp." : "Chưa có sản phẩm nào.";
    elements.status.hidden = false;
    return;
  }

  elements.status.hidden = true;
  elements.tableBody.innerHTML = visibleProducts
    .map(
      (product) => `
        <tr>
          <td data-label="ID">#${escapeHtml(product.id)}</td>
          <td data-label="Sản phẩm">
            <div class="table-product">
              <img src="${escapeHtml(product.img)}" alt="${escapeHtml(product.name)}" />
              <div><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.desc)}</small></div>
            </div>
          </td>
          <td data-label="Loại"><span class="type-tag">${escapeHtml(product.type)}</span></td>
          <td data-label="Giá"><strong>${formatCurrency(product.price)}</strong></td>
          <td data-label="Màn hình">${escapeHtml(product.screen)}</td>
          <td data-label="Thao tác">
            <div class="table-actions">
              <button class="action-button edit" type="button" data-action="edit" data-id="${escapeHtml(product.id)}">Sửa</button>
              <button class="action-button delete" type="button" data-action="delete" data-id="${escapeHtml(product.id)}">Xóa</button>
            </div>
          </td>
        </tr>
      `,
    )
    .join("");
}

function setModal(open) {
  elements.modal.hidden = !open;
  document.body.classList.toggle("no-scroll", open);
  if (open) setTimeout(() => elements.form.querySelector("input:not([type='hidden'])").focus(), 0);
}

function clearErrors() {
  document.querySelectorAll("[data-error-for]").forEach((element) => {
    element.textContent = "";
  });
  elements.form.querySelectorAll(".invalid").forEach((element) => element.classList.remove("invalid"));
}

function showErrors(errors) {
  Object.entries(errors).forEach(([field, message]) => {
    const input = elements.form.elements[field];
    const errorElement = document.querySelector(`[data-error-for="${field}"]`);
    input.classList.add("invalid");
    errorElement.textContent = message;
  });
}

function getFormValues() {
  return {
    name: elements.form.elements.name.value,
    price: elements.form.elements.price.value,
    type: elements.form.elements.type.value,
    screen: elements.form.elements.screen.value,
    backCamera: elements.form.elements.backCamera.value,
    frontCamera: elements.form.elements.frontCamera.value,
    img: elements.form.elements.img.value,
    desc: elements.form.elements.desc.value,
  };
}

function openCreateModal() {
  elements.form.reset();
  elements.productId.value = "";
  elements.modalTitle.textContent = "Thêm sản phẩm";
  elements.saveButton.textContent = "Thêm sản phẩm";
  clearErrors();
  setModal(true);
}

function openEditModal(product) {
  elements.form.reset();
  clearErrors();
  elements.productId.value = product.id;
  elements.modalTitle.textContent = "Cập nhật sản phẩm";
  elements.saveButton.textContent = "Lưu thay đổi";

  Object.entries(product.toPayload()).forEach(([field, value]) => {
    if (elements.form.elements[field]) elements.form.elements[field].value = value;
  });
  setModal(true);
}

async function loadProducts() {
  elements.status.hidden = false;
  elements.status.textContent = "Đang tải sản phẩm...";

  try {
    products = await productService.getAll();
    renderTable();
  } catch (error) {
    console.error("Lỗi lấy danh sách sản phẩm:", error);
    elements.status.textContent = "Không thể tải danh sách sản phẩm. Vui lòng tải lại trang.";
    elements.summary.textContent = "Không có dữ liệu";
  }
}

elements.addButton.addEventListener("click", openCreateModal);
elements.searchInput.addEventListener("input", renderTable);
elements.sortSelect.addEventListener("change", renderTable);

document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", () => setModal(false));
});

elements.form.addEventListener("input", (event) => {
  event.target.classList.remove("invalid");
  const errorElement = document.querySelector(`[data-error-for="${event.target.name}"]`);
  if (errorElement) errorElement.textContent = "";
});

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const values = getFormValues();
  const errors = validateProduct(values);
  clearErrors();

  if (Object.keys(errors).length) {
    showErrors(errors);
    return;
  }

  const product = new Product({ id: elements.productId.value, ...values });
  const isEditing = Boolean(product.id);
  elements.saveButton.disabled = true;
  elements.saveButton.textContent = "Đang lưu...";

  try {
    if (isEditing) await productService.update(product.id, product);
    else await productService.create(product);

    setModal(false);
    showToast(isEditing ? "Cập nhật sản phẩm thành công." : "Thêm sản phẩm thành công.");
    await loadProducts();
  } catch (error) {
    console.error("Lỗi lưu sản phẩm:", error);
    showToast("Không thể lưu sản phẩm. Vui lòng thử lại.", "error");
  } finally {
    elements.saveButton.disabled = false;
    elements.saveButton.textContent = isEditing ? "Lưu thay đổi" : "Thêm sản phẩm";
  }
});

// Một listener cho toàn bộ tbody xử lý cả nút sửa và xóa sau mỗi lần render.
elements.tableBody.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const product = products.find((item) => item.id === button.dataset.id);
  if (!product) return;

  if (button.dataset.action === "edit") {
    openEditModal(product);
    return;
  }

  if (!window.confirm(`Bạn có chắc muốn xóa “${product.name}”?`)) return;

  button.disabled = true;
  button.textContent = "Đang xóa...";
  try {
    await productService.remove(product.id);
    products = products.filter((item) => item.id !== product.id);
    renderTable();
    showToast("Xóa sản phẩm thành công.");
  } catch (error) {
    console.error("Lỗi xóa sản phẩm:", error);
    showToast("Không thể xóa sản phẩm. Vui lòng thử lại.", "error");
    button.disabled = false;
    button.textContent = "Xóa";
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !elements.modal.hidden) setModal(false);
});

loadProducts();
