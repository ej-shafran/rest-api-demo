const { STATUS_CODES } = require("http");

let id = 1;
const database = [];

function newFlavor(flavor) {
  return {
    flavor,
    id: id++,
    stock: 10,
    deleted: false,
  };
}

function httpError(code, rest) {
  return {
    status: STATUS_CODES[code],
    statusCode: code,
    ...rest,
  };
}

function findFlavor(req, res) {
  const { id } = req.params;
  const flavor = database.find((flavor) => flavor.id === Number(id));

  if (!flavor || flavor.deleted) {
    res.status(404).json(
      httpError(404, {
        message: `flavor with ID ${id} not found`,
        help: `GET ${req.baseUrl}/flavors for all flavors`,
        path: req.path,
      }),
    );
    return null;
  }

  return flavor;
}

function getCount(req, res) {
  if (!req.body.count || isNaN(req.body.count)) {
    res.status(400).json(
      httpError(400, {
        message: "the `count` field of the body must be a number",
        path: req.path,
      }),
    );
    return null;
  }

  return Number(req.body.count);
}

const express = require("express");
const router = express.Router();

router.post("/flavors", (req, res) => {
  if (!req.body.flavor) {
    res.status(400).json(
      httpError(400, {
        message: "the `flavor` field of the body is required",
        path: req.path,
      }),
    );
    return;
  }

  const flavor = newFlavor(req.body.flavor);
  database.push(flavor);
  res.status(201).json(flavor);
});

router.get("/flavors", (_, res) => {
  const results = database.filter((flavor) => flavor.deleted === false);

  res.status(200).json({ flavors: results, count: results.length });
});

router.get("/flavors/:id/stock", (req, res) => {
  const flavor = findFlavor(req, res);
  if (!flavor) return;

  res.status(200).json({ stock: flavor.stock });
});

router.put("/flavors/:id/buy", (req, res) => {
  const count = getCount(req, res);
  if (count === null) return;

  const flavor = findFlavor(req, res);
  if (!flavor) return;

  if (flavor.stock < count) {
    res.status(400).json(
      httpError(400, {
        message: "not enough items in stock to fulfill purchase",
        path: req.path,
      }),
    );
    return;
  }

  flavor.stock -= count;
  res.status(200).json({ stock: flavor.stock });
});

router.put("/flavors/:id/restock", (req, res) => {
  const count = getCount(req, res);
  if (count === null) return;

  const flavor = findFlavor(req, res);
  if (!flavor) return;

  flavor.stock += count;
  res.status(200).json({ stock: flavor.stock });
});

router.delete("/flavors/:id", (req, res) => {
  const flavor = findFlavor(req, res);
  if (!flavor) return;

  flavor.deleted = true;
  res.status(200).json(flavor);
});

module.exports = router;
