import Product from "../models/product.model.js";
import slugify from "slugify";
import cloudinary from "../config/cloudinary.js";

export const addProduct = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      images,
      stock,
      productType,
      category,
      grade,
      attributes,
    } = req.body;

    if (
      !title ||
      !price ||
      !category ||
      !grade ||
      !productType ||
      !images?.length
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const slug = slugify(`${title}-${grade}`, { lower: true });

    const product = await Product.create({
      title,
      slug,
      description,
      price,
      images,
      stock,
      productType,
      category,
      grade,
      attributes,
      createdBy: req.user._id,
    });

    res.status(201).json(product);
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ message: "Product grade already exists in this category" });
    }

    res.status(500).json({ message: "Failed to add product" });
  }
};

export const deleteCloudinaryImage = async (req, res) => {
  try {
    const { publicId } = req.query;

    if (!publicId) {
      return res.status(400).json({ message: "Public ID required" });
    }

    const res = await cloudinary.uploader.destroy(publicId);

    res.status(201).json({ message: "Image deleted from Cloudinary" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Cloudinary delete failed" });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const { search } = req.query;

    let query = {};

    if (search) {
      const regex = new RegExp(search, "i");

      query.$or = [{ title: regex }, { grade: regex }, { productType: regex }];
    }

    const products = await Product.find(query)
      .populate({
        path: "category",
        select: "name",
        match: search ? { name: new RegExp(search, "i") } : {},
      })
      .sort({ createdAt: -1 });

    // 🔥 remove products whose category didn't match search
    const filteredProducts = search
      ? products.filter(
          (p) =>
            p.category || // matched category
            p.title.toLowerCase().includes(search.toLowerCase()) ||
            p.grade.toLowerCase().includes(search.toLowerCase()) ||
            p.productType.toLowerCase().includes(search.toLowerCase())
        )
      : products;

    res.json(filteredProducts);
  } catch (err) {
    console.error("SEARCH PRODUCTS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (Array.isArray(product.images)) {
      for (const img of product.images) {
        const publicId = typeof img === "string" ? img : img.publicId;

        if (publicId) {
          const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: "image",
          });

          console.log("Cloudinary delete:", publicId, result);
        }
      }
    }

    await product.deleteOne();

    res.status(201).json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("DELETE PRODUCT ERROR:", err);
    res.status(500).json({ message: "Failed to delete product" });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "category",
      "name"
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(201).json(product);
  } catch (err) {
    console.error("GET PRODUCT ERROR:", err);
    res.status(500).json({ message: "Failed to fetch product" });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      images,
      stock,
      productType,
      category,
      grade,
      attributes,
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // regenerate slug only if title or grade changed
    let slug = product.slug;
    if (title !== product.title || grade !== product.grade) {
      slug = slugify(`${title}-${grade}`, { lower: true });
    }

    product.title = title;
    product.slug = slug;
    product.description = description;
    product.price = price;
    product.images = images;
    product.stock = stock;
    product.productType = productType;
    product.category = category;
    product.grade = grade;
    product.attributes = attributes;

    await product.save();

    res.status(201).json({ message: "Product updated successfully", product });
  } catch (err) {
    console.error("UPDATE PRODUCT ERROR:", err);

    if (err.code === 11000) {
      return res
        .status(400)
        .json({ message: "Product grade already exists in this category" });
    }

    res.status(500).json({ message: "Failed to update product" });
  }
};
