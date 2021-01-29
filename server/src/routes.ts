import express from "express";

export const router = express.Router();

router.get("/", function (req, res) {
  res.send("api is up and running!");
});

router.post("/", (req, res) => res.status(200).send(""));
