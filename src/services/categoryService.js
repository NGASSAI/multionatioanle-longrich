import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

const generateSlug = (text) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export const getAllCategories = async (includeInactive = false) => {
  const where = includeInactive ? {} : { isActive: true };
  return prisma.category.findMany({
    where,
    include: {
      children: true,
      _count: { select: { products: true } },
    },
    orderBy: { name: "asc" },
  });
};

export const getCategoryBySlug = async (slug) => {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      parent: true,
      children: true,
      _count: { select: { products: true } },
    },
  });
  if (!category) throw AppError.notFound("Catégorie introuvable");
  return category;
};

export const createCategory = async (data) => {
  const slug = data.slug || generateSlug(data.name);
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) throw AppError.conflict("Un slug similaire existe déjà", "SLUG_TAKEN");

  return prisma.category.create({
    data: { ...data, slug },
  });
};

export const updateCategory = async (id, data) => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw AppError.notFound("Catégorie introuvable");

  if (data.name && !data.slug) {
    data.slug = generateSlug(data.name);
  }

  return prisma.category.update({
    where: { id },
    data,
  });
};

export const deleteCategory = async (id) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!category) throw AppError.notFound("Catégorie introuvable");

  return prisma.category.delete({ where: { id } });
};