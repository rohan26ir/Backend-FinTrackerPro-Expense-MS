const PDFDocument = require("pdfkit");

/**
 * Generates an executive LIGHT BLACK (Charcoal Slate) PDF payment receipt buffer for subscription upgrades.
 */
exports.generateReceiptPDF = (paymentData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      const {
        userName,
        userEmail,
        plan,
        billingCycle,
        amount,
        currency,
        stripePaymentIntentId,
        createdAt,
      } = paymentData;

      // ─── Top Light Black / Charcoal Header (#1e293b) ───
      doc
        .rect(0, 0, 595.28, 85)
        .fill("#1e293b");

      doc
        .fillColor("#ffffff")
        .fontSize(22)
        .font("Helvetica-Bold")
        .text("FINTRACKERPRO", 40, 24);

      doc
        .fillColor("#cbd5e1")
        .fontSize(9.5)
        .font("Helvetica")
        .text("OFFICIAL PAYMENT RECEIPT & INVOICE STATEMENT", 40, 52);

      // Status Badge top right (Charcoal border badge)
      doc
        .rect(435, 28, 120, 26)
        .fill("#ffffff");

      doc
        .fillColor("#1e293b")
        .fontSize(9.5)
        .font("Helvetica-Bold")
        .text("PAID & ACTIVE", 445, 36, { width: 100, align: "center" });

      // ─── Receipt Metadata Box ───
      doc
        .fillColor("#1e293b")
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("RECEIPT DETAILS", 40, 110);

      doc
        .moveTo(40, 125)
        .lineTo(555, 125)
        .strokeColor("#cbd5e1")
        .lineWidth(1)
        .stroke();

      const details = [
        ["Receipt Number / Transaction ID:", stripePaymentIntentId || "pi_simulated_sandbox"],
        ["Date & Time Issued:", createdAt ? new Date(createdAt).toLocaleString() : new Date().toLocaleString()],
        ["Customer Name:", userName || "Valued Subscriber"],
        ["Customer Email:", userEmail],
        ["Payment Gateway Status:", "SUCCEEDED (Verified Integration)"],
      ];

      let yPos = 138;
      details.forEach(([label, value]) => {
        doc.fillColor("#64748b").fontSize(9.5).font("Helvetica").text(label, 40, yPos);
        doc.fillColor("#1e293b").fontSize(9.5).font("Helvetica-Bold").text(value, 230, yPos);
        yPos += 20;
      });

      // ─── Plan Order Summary Table ───
      yPos += 12;
      doc
        .fillColor("#1e293b")
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("SUBSCRIPTION ORDER BREAKDOWN", 40, yPos);

      yPos += 16;
      doc
        .rect(40, yPos, 515, 24)
        .fill("#334155"); // Soft Charcoal Slate header

      doc
        .fillColor("#ffffff")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("ITEM DESCRIPTION", 50, yPos + 7);

      doc
        .text("BILLING CYCLE", 280, yPos + 7);

      doc
        .text("AMOUNT", 470, yPos + 7, { width: 75, align: "right" });

      yPos += 28;

      // Table Item Row
      const itemTitle = `FintrackerPro Subscription (${(plan || "premium").toUpperCase()} Plan)`;
      doc
        .fillColor("#1e293b")
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(itemTitle, 50, yPos);

      doc
        .fillColor("#475569")
        .fontSize(9.5)
        .font("Helvetica")
        .text((billingCycle || "yearly").toUpperCase(), 280, yPos);

      const formattedAmount = `$${(amount || 0).toFixed(2)} ${currency || "USD"}`;
      doc
        .fillColor("#1e293b")
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(formattedAmount, 450, yPos, { width: 95, align: "right" });

      // Total Box (Light gray fill with soft charcoal border)
      yPos += 35;
      doc
        .rect(40, yPos, 515, 42)
        .fillAndStroke("#f8fafc", "#cbd5e1");

      doc
        .fillColor("#1e293b")
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("TOTAL AMOUNT CHARGED:", 50, yPos + 15);

      doc
        .fillColor("#1e293b")
        .fontSize(14)
        .font("Helvetica-Bold")
        .text(formattedAmount, 430, yPos + 13, { width: 115, align: "right" });

      // ─── Footer & Support ───
      const footerY = 750;
      doc
        .moveTo(40, footerY)
        .lineTo(555, footerY)
        .strokeColor("#cbd5e1")
        .lineWidth(0.75)
        .stroke();

      doc
        .fillColor("#475569")
        .fontSize(8.5)
        .font("Helvetica")
        .text("Thank you for upgrading your subscription with FintrackerPro!", 40, footerY + 12, {
          align: "center",
          width: 515,
        });

      doc
        .fillColor("#94a3b8")
        .fontSize(8)
        .font("Helvetica")
        .text("Need billing support? Contact support@fintrackerpro.com • Confidential Invoice Document", 40, footerY + 26, {
          align: "center",
          width: 515,
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
