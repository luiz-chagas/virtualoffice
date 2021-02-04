import express from "express";

export const router = express.Router();

router.get("/", function (req, res) {
  res.send("Hello API");
});

router.post("/", (req, res) => res.status(200).send(""));
