const nodemailer = require("nodemailer");
const ContactMessage = require("../models/ContactMessage");

/**
 * Mail Transporter Helper using environment credentials
 */
const createMailTransport = () => {
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.EMAIL_PORT || process.env.SMTP_PORT) || 587;
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  console.warn("SMTP credentials not found in env. Falling back to jsonTransport.");
  return nodemailer.createTransport({
    jsonTransport: true,
  });
};

/**
 * POST /api/contact (Public)
 * Save public contact form message
 */
exports.submitContact = async (req, res, next) => {
  try {
    const { name, email, subject, message, phone } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: "Please fill in all required contact fields." });
    }

    const contactDoc = await ContactMessage.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      phone: phone ? phone.trim() : "",
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Thank you for contacting us! Our team will review your message and email you a response shortly.",
      data: { ...contactDoc.toObject(), id: contactDoc._id.toString() },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/contact (Protected - Admin/Mod)
 * List all incoming public contact messages
 */
exports.getAllContactMessages = async (req, res, next) => {
  try {
    const user = req.user;
    const isAdminOrMod = user.role === "admin" || user.role === "moderator" || user.email.toLowerCase() === "rohan26ir@gmail.com";

    if (!isAdminOrMod) {
      return res.status(403).json({ success: false, message: "Access denied. Admin or Moderator privileges required." });
    }

    const messages = await ContactMessage.find().sort({ createdAt: -1 }).lean();

    res.json({
      success: true,
      data: messages.map((m) => ({ ...m, id: m._id.toString() })),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/contact/:id/reply (Protected - Admin/Mod)
 * Post an answer and dispatch an official email response to the user
 */
exports.replyContactMessage = async (req, res, next) => {
  try {
    const user = req.user;
    const isAdminOrMod = user.role === "admin" || user.role === "moderator" || user.email.toLowerCase() === "rohan26ir@gmail.com";

    if (!isAdminOrMod) {
      return res.status(403).json({ success: false, message: "Access denied. Admin or Moderator privileges required." });
    }

    const { id } = req.params;
    const { replyMessage } = req.body;

    if (!replyMessage || !replyMessage.trim()) {
      return res.status(400).json({ success: false, message: "Reply message body cannot be empty." });
    }

    const contactDoc = await ContactMessage.findById(id);
    if (!contactDoc) {
      return res.status(404).json({ success: false, message: "Contact message submission not found." });
    }

    // Update status and save reply
    contactDoc.status = "answered";
    contactDoc.replyMessage = replyMessage.trim();
    contactDoc.repliedBy = user.name || "DailyFinTracker Support Team";
    contactDoc.repliedAt = new Date();
    await contactDoc.save();

    // Dispatch Real Email Response via SMTP / Nodemailer
    let emailSent = false;
    let emailErrorMsg = "";

    try {
      const transporter = createMailTransport();
      const fromEmail = process.env.EMAIL_FROM || `"DailyFinTracker Support" <${process.env.EMAIL_USER}>`;

      console.log(`[SMTP] Sending contact reply email to: ${contactDoc.email} from ${fromEmail}`);

      const info = await transporter.sendMail({
        from: fromEmail,
        to: contactDoc.email,
        subject: `Re: ${contactDoc.subject} [DailyFinTracker Support Response]`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 16px; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 20px; text-align: center; border-radius: 12px; color: #ffffff;">
              <h2 style="margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">DailyFinTracker Pro</h2>
              <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Official Customer Support Desk</p>
            </div>
            
            <div style="padding: 24px 8px;">
              <p style="font-size: 15px;">Hello <strong>${contactDoc.name}</strong>,</p>
              
              <p style="font-size: 14px; color: #475569;">Thank you for contacting DailyFinTracker Support. An Admin / Moderator has reviewed your inquiry regarding <strong>"${contactDoc.subject}"</strong>.</p>
              
              <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 18px; margin: 20px 0; border-radius: 8px;">
                <p style="margin: 0; font-size: 12px; font-weight: 800; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.5px;">Official Response from Support Team:</p>
                <p style="margin-top: 10px; font-size: 14px; color: #1e293b; white-space: pre-wrap; line-height: 1.6;">${replyMessage.trim()}</p>
              </div>

              <div style="background-color: #f1f5f9; padding: 14px; border-radius: 10px; font-size: 12px; color: #64748b; margin-top: 24px;">
                <p style="margin: 0; font-weight: 700; color: #334155;">Your Original Inquiry Message:</p>
                <p style="margin-top: 6px; font-style: italic; color: #475569;">"${contactDoc.message}"</p>
              </div>

              <p style="margin-top: 24px; font-size: 13px; color: #64748b;">If you have any follow-up questions, feel free to reply to this email or log in to your user dashboard anytime.</p>
              
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

              <div style="display: flex; justify-content: space-between; items-center;">
                <div>
                  <p style="font-size: 13px; font-weight: 700; color: #4f46e5; margin: 0;">Best regards,</p>
                  <p style="font-size: 13px; font-weight: 600; color: #1e293b; margin: 2px 0 0 0;">The DailyFinTracker Support Team</p>
                </div>
              </div>

              <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b;">
                <p style="margin: 0; font-weight: 600;">Developed by <a href="https://meetrohan.netlify.app/" target="_blank" style="color: #4f46e5; text-decoration: underline; font-weight: 700;">Rohan</a></p>
              </div>
            </div>
          </div>
        `,
      });

      console.log(`[SMTP] Email dispatch result:`, info.messageId || info);
      emailSent = true;
    } catch (emailErr) {
      console.error("[SMTP Error] Contact reply email dispatch failed:", emailErr.message);
      emailErrorMsg = emailErr.message;
    }

    res.json({
      success: true,
      message: emailSent
        ? `Reply saved & official HTML email successfully sent to ${contactDoc.email}!`
        : `Reply saved in database. (Email dispatch log: ${emailErrorMsg || "Check SMTP server settings"})`,
      data: { ...contactDoc.toObject(), id: contactDoc._id.toString() },
      emailSent,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/contact/:id (Protected - Admin/Mod)
 * Delete a contact form submission
 */
exports.deleteContactMessage = async (req, res, next) => {
  try {
    const user = req.user;
    const isAdminOrMod = user.role === "admin" || user.role === "moderator" || user.email.toLowerCase() === "rohan26ir@gmail.com";

    if (!isAdminOrMod) {
      return res.status(403).json({ success: false, message: "Access denied. Admin or Moderator privileges required." });
    }

    const { id } = req.params;
    const contactDoc = await ContactMessage.findByIdAndDelete(id);

    if (!contactDoc) {
      return res.status(404).json({ success: false, message: "Contact submission not found." });
    }

    res.json({
      success: true,
      message: "Contact submission deleted successfully.",
    });
  } catch (err) {
    next(err);
  }
};
