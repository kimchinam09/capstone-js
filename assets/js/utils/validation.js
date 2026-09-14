const imageUrlPattern = /^https?:\/\/\S+$/i;

export function validateProduct(values) {
  const errors = {};

  if (!values.name.trim()) errors.name = "Vui lòng nhập tên sản phẩm.";
  else if (values.name.trim().length < 2) errors.name = "Tên cần ít nhất 2 ký tự.";

  if (values.price === "") errors.price = "Vui lòng nhập giá sản phẩm.";
  else if (!Number.isFinite(Number(values.price)) || Number(values.price) <= 0) {
    errors.price = "Giá phải là số lớn hơn 0.";
  }

  ["screen", "backCamera", "frontCamera", "desc"].forEach((field) => {
    if (!values[field].trim()) errors[field] = "Không được để trống.";
  });

  if (!values.img.trim()) errors.img = "Vui lòng nhập đường dẫn hình ảnh.";
  else if (!imageUrlPattern.test(values.img.trim())) errors.img = "Hình ảnh phải là URL http/https hợp lệ.";

  if (!["samsung", "iphone"].includes(values.type)) errors.type = "Vui lòng chọn loại sản phẩm.";

  return errors;
}
