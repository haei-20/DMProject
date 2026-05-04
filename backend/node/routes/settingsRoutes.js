const express = require("express");
const {
  getMergedGeneralSettings,
  getPublicCurrencyPayload,
} = require("../services/generalSettingsService");

const router = express.Router();

/**
 * Công khai: chỉ trả các field hiển thị tiền tệ cho storefront (không lộ email/SMTP).
 */
router.get("/general", async (req, res) => {
  try {
    const merged = await getMergedGeneralSettings();
    res.status(200).json(getPublicCurrencyPayload(merged));
  } catch (error) {
    console.error("Error fetching public general settings:", error);
    res.status(500).json({
      message: "Error fetching public settings",
      error: error.toString(),
    });
  }
});

module.exports = router;
