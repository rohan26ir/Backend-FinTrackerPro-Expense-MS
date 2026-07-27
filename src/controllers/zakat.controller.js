const Zakat = require("../models/Zakat");

/**
 * GET /api/zakat
 */
exports.getZakatRecords = async (req, res, next) => {
  try {
    const records = await Zakat.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/zakat
 */
exports.createZakatRecord = async (req, res, next) => {
  try {
    const {
      year,
      title,
      nisabStandard,
      nisabThreshold,
      cashInHand,
      goldSilverValue,
      investmentsValue,
      businessGoods,
      moneyOwedToYou,
      liabilities,
      status,
      notes,
    } = req.body;

    const totalAssets =
      Number(cashInHand || 0) +
      Number(goldSilverValue || 0) +
      Number(investmentsValue || 0) +
      Number(businessGoods || 0) +
      Number(moneyOwedToYou || 0);

    const netWealth = Math.max(0, totalAssets - Number(liabilities || 0));
    const nisab = Number(nisabThreshold || 520);
    const zakatDue = netWealth >= nisab ? netWealth * 0.025 : 0;

    const record = await Zakat.create({
      user: req.user._id,
      year: year || new Date().getFullYear(),
      title: title || "Annual Zakat Assessment",
      nisabStandard: nisabStandard || "silver",
      nisabThreshold: nisab,
      cashInHand: Number(cashInHand || 0),
      goldSilverValue: Number(goldSilverValue || 0),
      investmentsValue: Number(investmentsValue || 0),
      businessGoods: Number(businessGoods || 0),
      moneyOwedToYou: Number(moneyOwedToYou || 0),
      liabilities: Number(liabilities || 0),
      netZakatableWealth: netWealth,
      zakatDue,
      status: status || "Calculated",
      notes: notes || "",
    });

    res.status(201).json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/zakat/:id
 */
exports.updateZakatRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    let record = await Zakat.findOne({ _id: id, user: req.user._id });

    if (!record) {
      return res.status(404).json({ success: false, message: "Zakat record not found" });
    }

    const {
      title,
      year,
      nisabStandard,
      nisabThreshold,
      cashInHand,
      goldSilverValue,
      investmentsValue,
      businessGoods,
      moneyOwedToYou,
      liabilities,
      status,
      notes,
    } = req.body;

    if (title !== undefined) record.title = title;
    if (year !== undefined) record.year = year;
    if (nisabStandard !== undefined) record.nisabStandard = nisabStandard;
    if (nisabThreshold !== undefined) record.nisabThreshold = Number(nisabThreshold);
    if (cashInHand !== undefined) record.cashInHand = Number(cashInHand);
    if (goldSilverValue !== undefined) record.goldSilverValue = Number(goldSilverValue);
    if (investmentsValue !== undefined) record.investmentsValue = Number(investmentsValue);
    if (businessGoods !== undefined) record.businessGoods = Number(businessGoods);
    if (moneyOwedToYou !== undefined) record.moneyOwedToYou = Number(moneyOwedToYou);
    if (liabilities !== undefined) record.liabilities = Number(liabilities);
    if (status !== undefined) record.status = status;
    if (notes !== undefined) record.notes = notes;

    const totalAssets =
      record.cashInHand +
      record.goldSilverValue +
      record.investmentsValue +
      record.businessGoods +
      record.moneyOwedToYou;

    record.netZakatableWealth = Math.max(0, totalAssets - record.liabilities);
    record.zakatDue = record.netZakatableWealth >= record.nisabThreshold ? record.netZakatableWealth * 0.025 : 0;

    await record.save();

    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/zakat/:id
 */
exports.deleteZakatRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const record = await Zakat.findOneAndDelete({ _id: id, user: req.user._id });

    if (!record) {
      return res.status(404).json({ success: false, message: "Zakat record not found" });
    }

    res.json({ success: true, message: "Zakat record deleted successfully" });
  } catch (err) {
    next(err);
  }
};
