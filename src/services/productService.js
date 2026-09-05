import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

const generateSlug = (text) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

// Ajoute isLikedByMe a chaque produit si un utilisateur connecte est fourni,
// sans requete supplementaire par produit (une seule requete groupee).
const attachLikedByMe = async (products, currentUserId) => {
  if (!currentUserId || products.length === 0) {
    return products.map((p) => ({ ...p, isLikedByMe: false }));
  }

  const likes = await prisma.productLike.findMany({
    where: { userId: currentUserId, productId: { in: products.map((p) => p.id) } },
    select: { productId: true },
  });
  const likedIds = new Set(likes.map((l) => l.productId));

  return products.map((p) => ({ ...p, isLikedByMe: likedIds.has(p.id) }));
};

export const getAllProducts = async ({
  categoryId,
  search,
  featured,
  minPrice,
  maxPrice,
  sortBy = "createdAt",
  order = "desc",
  page = 1,
  limit = 12,
  includeInactive = false,
  currentUserId = null,
}) => {
  const where = {
    ...(includeInactive ? {} : { isActive: true }),
    ...(categoryId ? { categoryId } : {}),
    ...(featured !== undefined ? { isFeatured: featured === "true" } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(minPrice || maxPrice
      ? {
          price: {
            ...(minPrice ? { gte: Number(minPrice) } : {}),
            ...(maxPrice ? { lte: Number(maxPrice) } : {}),
          },
        }
      : {}),
  };

  const skip = (Number(page) - 1) * Number(limit);

  const products = await prisma.product.findMany({
    where,
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { order: "asc" } },
    },
    orderBy: { [sortBy]: order },
    skip,
    take: Number(limit),
  });
  const total = await prisma.product.count({ where });

  const productsWithLikes = await attachLikedByMe(products, currentUserId);

  return {
    products: productsWithLikes,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};

export const getProductBySlug = async (slug, { incrementViews = true, currentUserId = null } = {}) => {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: { orderBy: { order: "asc" } },
      comments: {
        where: { isApproved: true, parentId: null },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          replies: {
            where: { isApproved: true },
            include: { user: { select: { id: true, name: true, avatar: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!product) throw AppError.notFound("Produit introuvable");

  if (incrementViews) {
    await prisma.product.update({
      where: { id: product.id },
      data: { viewsCount: { increment: 1 } },
    });
  }

  const [withLikes] = await attachLikedByMe([product], currentUserId);
  return withLikes;
};

export const getProductByIdRaw = async (id) => {
  return prisma.product.findUnique({ where: { id } });
};

export const createProduct = async (data) => {
  const { images, ...productData } = data;
  const slug = productData.slug || generateSlug(productData.name);
  const sku = productData.sku || `PRD-${Date.now()}`;

  const existingSlug = await prisma.product.findUnique({ where: { slug } });
  if (existingSlug) throw AppError.conflict("Un produit avec ce slug existe deja", "SLUG_TAKEN");

  const existingSku = await prisma.product.findUnique({ where: { sku } });
  if (existingSku) throw AppError.conflict("Un produit avec ce SKU existe deja", "SKU_TAKEN");

  return prisma.product.create({
    data: {
      ...productData,
      slug,
      sku,
      images: images && images.length > 0
        ? {
            create: images.map((imgPath, index) => ({
              path: typeof imgPath === "string" ? imgPath : imgPath.path,
              order: index,
              isMain: index === 0,
            })),
          }
        : undefined,
    },
    include: { images: true, category: true },
  });
};

export const updateProduct = async (id, data) => {
  const { images, ...productData } = data;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw AppError.notFound("Produit introuvable");

  if (productData.name && !productData.slug) {
    productData.slug = generateSlug(productData.name);
  }

  return prisma.$transaction(async (tx) => {
    if (images) {
      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.productImage.createMany({
        data: images.map((img) => ({ ...img, productId: id })),
      });
    }

    return tx.product.update({
      where: { id },
      data: productData,
      include: { images: true, category: true },
    });
  });
};

export const deleteProduct = async (id) => {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw AppError.notFound("Produit introuvable");

  return prisma.product.delete({ where: { id } });
};