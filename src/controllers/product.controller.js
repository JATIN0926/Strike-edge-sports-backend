import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import slugify from "slugify";
import cloudinary from "../config/cloudinary.js";
import categoryModel from "../models/category.model.js";

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

    const result = await cloudinary.uploader.destroy(publicId);

    return res.status(200).json({
      message: "Image deleted from Cloudinary",
      result,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Cloudinary delete failed" });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 6,
      search = "",
      sort = "latest",
      type = "all",
      category = "all",
    } = req.query;

    const numericLimit = Number(limit);
    const skip = (Number(page) - 1) * numericLimit;

    let query = { isActive: true };

    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [{ title: regex }, { grade: regex }];
    }

    if (type !== "all") {
      query.productType = type;
    }

    if (category !== "all") {
      const categoryDoc = await categoryModel.findOne({
        slug: category,
        isActive: true,
      });

      if (!categoryDoc) {
        return res.status(404).json({
          message: "Category not found",
        });
      }

      query.category = categoryDoc._id;
    }

    /* ↕ Sorting */
    let sortQuery = {};
    switch (sort) {
      case "price-asc":
        sortQuery.price = 1;
        break;
      case "price-desc":
        sortQuery.price = -1;
        break;
      case "popular":
        sortQuery.soldCount = -1;
        break;
      default:
        sortQuery.createdAt = -1;
    }

    const products = await Product.find(query)
      .populate("category", "name")
      .sort(sortQuery)
      .skip(skip)
      .limit(numericLimit);

    const total = await Product.countDocuments(query);

    res.status(200).json({ products, total });
  } catch (err) {
    console.error(err);
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

export const getProductByIdPublic = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isActive: true,
    }).populate("category", "name");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (err) {
    console.error("GET PRODUCT PUBLIC ERROR:", err);
    res.status(500).json({ message: "Failed to fetch product" });
  }
};

export const getRelatedProducts = async (req, res) => {
  try {
    const { productId } = req.params;

    const currentProduct = await Product.findById(productId);

    if (!currentProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const relatedProducts = await Product.find({
      _id: { $ne: productId },
      isActive: true,
      $or: [
        { category: currentProduct.category },
        { productType: currentProduct.productType },
      ],
    })
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .limit(3);

    res.status(200).json(relatedProducts);
  } catch (err) {
    console.error("RELATED PRODUCTS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch related products" });
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

export const getProductsByCategorySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const { limit = 6, type = "all" } = req.query;

    // 1️⃣ Find category by slug
    const category = await categoryModel.findOne({
      slug,
      isActive: true,
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // 2️⃣ Build query
    let query = {
      category: category._id,
      isActive: true,
    };

    if (type !== "all") {
      query.productType = type;
    }

    // 3️⃣ Fetch products
    const products = await Product.find(query)
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.status(200).json({
      category,
      products,
    });
  } catch (err) {
    console.error("CATEGORY SLUG PRODUCTS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

export const toggleSavedProduct = async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.params;

  const user = await User.findById(userId);

  const alreadySaved = user.savedProducts.includes(productId);

  if (alreadySaved) {
    user.savedProducts.pull(productId);
  } else {
    user.savedProducts.push(productId);
  }

  await user.save();

  res.status(200).json({
    saved: !alreadySaved,
    savedProducts: user.savedProducts,
  });
};

export const getSavedProducts = async (req, res) => {
  const user = await User.findById(req.user._id).populate("savedProducts");

  res.status(200).json({
    products: user.savedProducts,
  });
};
