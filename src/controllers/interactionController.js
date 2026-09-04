import * as interactionService from "../services/interactionService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const toggleLike = asyncHandler(async (req, res) => {
  const result = await interactionService.toggleProductLike(req.user.id, req.params.productId);
  res.json({ success: true, data: result });
});

export const addComment = asyncHandler(async (req, res) => {
  const comment = await interactionService.addComment(
    req.user.id,
    req.params.productId,
    req.body
  );
  res.status(201).json({ success: true, data: { comment } });
});

export const moderateComment = asyncHandler(async (req, res) => {
  const { isApproved } = req.body;
  const comment = await interactionService.moderateComment(req.params.id, isApproved);
  res.json({ success: true, data: { comment } });
});

export const deleteComment = asyncHandler(async (req, res) => {
  await interactionService.deleteComment(req.params.id);
  res.json({ success: true, data: null });
});