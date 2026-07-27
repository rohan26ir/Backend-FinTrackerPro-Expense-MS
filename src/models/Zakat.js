const mongoose = require("mongoose");

const zakatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    year: {
      type: Number,
      default: () => new Date().getFullYear(),
    },
    title: {
      type: String,
      default: "Annual Zakat Assessment",
    },
    nisabStandard: {
      type: String,
      enum: ["silver", "gold"],
      default: "silver",
    },
    nisabThreshold: {
      type: Number,
      default: 520,
    },
    cashInHand: {
      type: Number,
      default: 0,
    },
    goldSilverValue: {
      type: Number,
      default: 0,
    },
    investmentsValue: {
      type: Number,
      default: 0,
    },
    businessGoods: {
      type: Number,
      default: 0,
    },
    moneyOwedToYou: {
      type: Number,
      default: 0,
    },
    liabilities: {
      type: Number,
      default: 0,
    },
    netZakatableWealth: {
      type: Number,
      required: true,
    },
    zakatDue: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Calculated", "Paid", "Pending"],
      default: "Calculated",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Zakat", zakatSchema);
