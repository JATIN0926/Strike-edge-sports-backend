import Category from "../models/category.model.js";
import slugify from "slugify";

export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const slug = slugify(name, { lower: true });

    const exists = await Category.findOne({ slug });
    if (exists) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = await Category.create({ name, slug });

    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: "Failed to create category" });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select("name slug")
      .sort({ name: 1 });

    res.status(200).json({
      categories,
    });
  } catch (err) {
    console.error("GET CATEGORIES ERROR:", err);
    res.status(500).json({
      message: "Failed to fetch categories",
    });
  }
};


export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Category name required" });
    }

    const slug = slugify(name, { lower: true });

    const exists = await Category.findOne({
      slug,
      _id: { $ne: id },
    });

    if (exists) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { name, slug },
      { new: true }
    );

    res.json(category);
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    await Category.findByIdAndUpdate(id, { isActive: false });

    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
};
