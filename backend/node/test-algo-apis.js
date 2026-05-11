#!/usr/bin/env node
/* eslint-disable no-console */
require("dotenv").config();

const API_BASE = process.env.API_BASE_URL || "http://localhost:5000/api";
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || "adminpassword123";

const tests = [];

const pushResult = (name, ok, status, details = "") => {
  tests.push({ name, ok, status, details });
};

const requestJson = async (path, options = {}) => {
  const res = await fetch(`${API_BASE}${path}`, options);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (e) {
    json = { raw: text };
  }
  return { res, json };
};

const printSummary = () => {
  console.log("\n=== API ALGORITHM TEST SUMMARY ===");
  for (const t of tests) {
    const mark = t.ok ? "PASS" : "FAIL";
    console.log(`[${mark}] ${t.name} | status=${t.status}${t.details ? ` | ${t.details}` : ""}`);
  }
  const passed = tests.filter((t) => t.ok).length;
  console.log(`\nPassed ${passed}/${tests.length} tests.`);
};

(async () => {
  let token = "";
  let productId = "";

  // 1) Login to get admin token
  try {
    const { res, json } = await requestJson("/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });

    token = json?.token || "";
    const ok = res.status === 200 && !!token;
    pushResult("POST /users/login", ok, res.status, ok ? `role=${json?.role || "n/a"}` : (json?.message || "no token"));
  } catch (err) {
    pushResult("POST /users/login", false, "ERR", err.message);
  }

  // 2) Gợi ý người dùng (luật cặp)
  try {
    const { res, json } = await requestJson("/recommend/user");
    const count = Array.isArray(json?.recommendations) ? json.recommendations.length : -1;
    const ok = res.status === 200 && count >= 0;
    pushResult("GET /recommend/user", ok, res.status, `recommendations=${count}`);
  } catch (err) {
    pushResult("GET /recommend/user", false, "ERR", err.message);
  }

  // 3) FP-Growth style endpoint for admin recommendations
  try {
    const { res, json } = await requestJson("/recommend/admin");
    const count = Array.isArray(json?.recommendations) ? json.recommendations.length : -1;
    const ok = res.status === 200 && count >= 0;
    pushResult("GET /recommend/admin", ok, res.status, `recommendations=${count}`);
  } catch (err) {
    pushResult("GET /recommend/admin", false, "ERR", err.message);
  }

  // 4) Cart endpoint (guest)
  try {
    const { res, json } = await requestJson("/cart");
    const ok = res.status === 200 && (Array.isArray(json?.items) || Array.isArray(json?.recommendations));
    pushResult("GET /cart", ok, res.status);
  } catch (err) {
    pushResult("GET /cart", false, "ERR", err.message);
  }

  // 5) Deal Hot endpoint
  try {
    const { res, json } = await requestJson("/products/deal-hot?limit=5");
    const products = Array.isArray(json?.products) ? json.products : [];
    productId = products[0]?._id || "";
    const ok = res.status === 200 && Array.isArray(json?.products);
    pushResult("GET /products/deal-hot", ok, res.status, `products=${products.length}`);
  } catch (err) {
    pushResult("GET /products/deal-hot", false, "ERR", err.message);
  }

  // 6) Related products endpoint
  try {
    if (!productId) {
      const productRes = await requestJson("/products?page=1");
      const list = Array.isArray(productRes.json?.products) ? productRes.json.products : [];
      productId = list[0]?._id || "";
    }

    if (!productId) {
      pushResult("GET /products/{id}/related", false, "SKIP", "No product ID available");
    } else {
      const { res, json } = await requestJson(`/products/${productId}/related`);
      const ok = res.status === 200;
      const count = Array.isArray(json?.relatedProducts)
        ? json.relatedProducts.length
        : Array.isArray(json?.products)
          ? json.products.length
          : Array.isArray(json)
            ? json.length
            : 0;
      pushResult("GET /products/{id}/related", ok, res.status, `related=${count}`);
    }
  } catch (err) {
    pushResult("GET /products/{id}/related", false, "ERR", err.message);
  }

  // 7) Frequently bought together report (admin token required)
  try {
    if (!token) {
      pushResult("GET /admin/reports/frequently-bought-together", false, "SKIP", "No admin token");
    } else {
      const { res, json } = await requestJson(
        "/admin/reports/frequently-bought-together?minSupport=0.01&limit=10&orderLimit=500",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const count = Array.isArray(json?.frequentItemsets) ? json.frequentItemsets.length : -1;
      const ok = res.status === 200 && count >= 0;
      pushResult(
        "GET /admin/reports/frequently-bought-together",
        ok,
        res.status,
        `success=${json?.success} itemsets=${count}`
      );
    }
  } catch (err) {
    pushResult("GET /admin/reports/frequently-bought-together", false, "ERR", err.message);
  }

  printSummary();

  const failed = tests.some((t) => !t.ok);
  process.exit(failed ? 1 : 0);
})().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

