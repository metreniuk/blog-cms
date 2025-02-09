import { Router } from "express";
import { supabase } from "../config/index.js";

const router = Router();

// Get all tags
router.get("/", async (req, res, next) => {
  try {
    const { data: tags, error } = await supabase.from("tags").select("*");

    if (error) throw new Error(error.message);
    res.json(tags);
  } catch (error) {
    next(error);
  }
});

// Create tag
router.post("/", async (req, res, next) => {
  try {
    const { name } = req.body;
    const { data: tag, error } = await supabase
      .from("tags")
      .insert({ name })
      .select()
      .single();

    if (error) throw new Error(error.message);
    res.status(201).json(tag);
  } catch (error) {
    next(error);
  }
});

// Update tag
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const { data: tag, error } = await supabase
      .from("tags")
      .update({ name })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error("Tag not found");
    res.json(tag);
  } catch (error) {
    next(error);
  }
});

// Delete tag
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("tags").delete().eq("id", id);

    if (error) throw new Error("Tag not found");
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
