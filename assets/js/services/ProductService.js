import { API_URL } from "../constants.js";
import Product from "../models/Product.js";

class ProductService {
  async getAll() {
    const response = await axios.get(API_URL);
    return response.data.map((product) => new Product(product));
  }

  async create(product) {
    const response = await axios.post(API_URL, product.toPayload());
    return new Product(response.data);
  }

  async update(id, product) {
    const response = await axios.put(`${API_URL}/${id}`, product.toPayload());
    return new Product(response.data);
  }

  async remove(id) {
    return axios.delete(`${API_URL}/${id}`);
  }
}

export const productService = new ProductService();

