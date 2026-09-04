import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

// --- GESTION DES LIKES ---

export const toggleProductLike = async (userId, productId) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw AppError.notFound("Produit introuvable");

  const existingLike = await prisma.productLike.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  return prisma.$transaction(async (tx) => {
    if (existingLike) {
      // Supprimer le like et décrémenter le compteur
      await tx.productLike.delete({ where: { id: existingLike.id } });
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { likesCount: { decrement: 1 } },
      });
      return { liked: false, likesCount: updatedProduct.likesCount };
    } else {
      // Ajouter le like et incrémenter le compteur
      await tx.productLike.create({ data: { userId, productId } });
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { likesCount: { increment: 1 } },
      });
      return { liked: true, likesCount: updatedProduct.likesCount };
    }
  });
};

// --- GESTION DES COMMENTAIRES ---

export const addComment = async (userId, productId, { comment, parentId }) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw AppError.notFound("Produit introuvable");

  if (parentId) {
    const parentComment = await prisma.productComment.findUnique({ where: { id: parentId } });
    if (!parentComment) throw AppError.notFound("Commentaire parent introuvable");
  }

  return prisma.$transaction(async (tx) => {
    const newComment = await tx.productComment.create({
      data: {
        userId,
        productId,
        comment,
        parentId,
        isApproved: true, // Visible immédiatement par défaut (section 2 cahier des charges)
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    await tx.product.update({
      where: { id: productId },
      data: { commentsCount: { increment: 1 } },
    });

    return newComment;
  });
};

export const moderateComment = async (commentId, isApproved) => {
  const comment = await prisma.productComment.findUnique({ where: { id: commentId } });
  if (!comment) throw AppError.notFound("Commentaire introuvable");

  return prisma.productComment.update({
    where: { id: commentId },
    data: { isApproved },
  });
};

export const deleteComment = async (commentId) => {
  const comment = await prisma.productComment.findUnique({ where: { id: commentId } });
  if (!comment) throw AppError.notFound("Commentaire introuvable");

  return prisma.$transaction(async (tx) => {
    await tx.productComment.delete({ where: { id: commentId } });

    await tx.product.update({
      where: { id: comment.productId },
      data: { commentsCount: { decrement: 1 } },
    });

    return true;
  });
};