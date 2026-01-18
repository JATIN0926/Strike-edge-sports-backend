import ProductType from "../models/productType.model.js";
import slugify from "slugify";

export const createProductType = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Product type name is required" });
    }

    const slug = slugify(name, { lower: true });

    const exists = await ProductType.findOne({ slug });
    if (exists) {
      return res.status(400).json({ message: "Product type already exists" });
    }

    const productType = await ProductType.create({ name, slug });

    res.status(201).json(productType);
  } catch (err) {
    res.status(500).json({ message: "Failed to create product type" });
  }
};

export const getAllProductTypes = async (req, res) => {
  try {
    const productTypes = await ProductType.find({ isActive: true })
      .select("name slug")
      .sort({ name: 1 });

    res.status(200).json({
      productTypes,
    });
  } catch (err) {
    console.error("GET PRODUCT TYPES ERROR:", err);
    res.status(500).json({
      message: "Failed to fetch product types",
    });
  }
};

export const updateProductType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Product type name required" });
    }

    const slug = slugify(name, { lower: true });

    const exists = await ProductType.findOne({
      slug,
      _id: { $ne: id },
    });

    if (exists) {
      return res.status(400).json({ message: "Product type already exists" });
    }

    const productType = await ProductType.findByIdAndUpdate(
      id,
      { name, slug },
      { new: true }
    );

    res.json(productType);
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
};

export const deleteProductType = async (req, res) => {
  try {
    const { id } = req.params;

    await ProductType.findByIdAndDelete(id);

    res.json({ message: "Product type deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
};