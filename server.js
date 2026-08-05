require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // ✅ Serve images correctly

// ✅ Routes
const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);

const invoiceRoutes = require("./routes/invoiceRoutes");
app.use("/api/invoices", invoiceRoutes);

// 📌 MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ DB Connection Error:', err));

// 📌 Project Schema & Model
const ProjectSchema = new mongoose.Schema({
    title: String,
    description: String,
    link: String,
    image: String
});
const Project = mongoose.model('Project', ProjectSchema);

// 📌 Multer Storage for Image Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage });

// 📌 Upload New Project
app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
        const { title, description, link } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: "Image upload failed!" });
        }

        const image = `/uploads/${req.file.filename}`;
        console.log("✅ Image saved at:", image); // Debugging log

        const project = new Project({ title, description, link, image });
        await project.save();

        res.json({ message: '✅ Project Uploaded!', project });
    } catch (error) {
        console.error("❌ Upload Error:", error);
        res.status(500).json({ error: 'Error uploading project' });
    }
});

// 📌 Get All Projects
app.get('/api/projects', async (req, res) => {
    try {
        const projects = await Project.find();
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching projects' });
    }
});

// 📌 Update Project
app.put('/api/update/:id', async (req, res) => {
    try {
        const { title, description, link } = req.body;
        const updatedProject = await Project.findByIdAndUpdate(req.params.id, { title, description, link }, { new: true });
        res.json({ message: '✅ Project Updated!', updatedProject });
    } catch (error) {
        res.status(500).json({ error: 'Error updating project' });
    }
});

// 📌 Delete Project
app.delete('/api/delete/:id', async (req, res) => {
    try {
        await Project.findByIdAndDelete(req.params.id);
        res.json({ message: '✅ Project Deleted!' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting project' });
    }
});

// 📌 Email Transporter (Using Gmail SMTP)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail ID
    pass: process.env.EMAIL_PASS, // App Password (not Gmail password)
  },
});

// 📌 Function to Send Email to User
const sendUserEmail = (email, name) => {
  return {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Thank You for Reaching Out!",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
        <img src="cid:thankyouimage" alt="Thank You" style="width: 100%; max-width: 400px; border-radius: 10px;">
        <h2>Dear ${name},</h2>
        <p>Thank you for contacting us regarding Santhosh.</p>
        <p>We have received your message and will get back to you as soon as possible.</p>
        <p>We appreciate your time and trust in us. If you have any urgent queries, feel free to reach out to us directly.</p>
        <p>Looking forward to assisting you!</p>
        <br>
        <strong>Best regards,</strong><br>
        <strong>Santhosh</strong>
      </div>
    `,
    attachments: [
      {
        filename: "./thank you.png",
        path: path.join(__dirname, "./thank you.png"), // ✅ Correct absolute path
        cid: "thankyouimage", // Content ID for embedding in email
      },
    ],
  };
};

// 📌 Function to Send Admin Notification Email
const sendAdminEmail = (data) => {
  return {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER, // Sends to admin's email
    subject: "New Contact Form Submission",
    text: `📩 New Contact Form Submission:
    
    Name: ${data.name}
    Email: ${data.email}
    Mobile: ${data.mobile}
    Subject: ${data.subject}
    Message: ${data.message}`,
  };
};

// 📌 API Route to Handle Contact Form Submission
app.post("/api/contact", async (req, res) => {
  const { name, email, mobile, subject, message } = req.body;

  if (!name || !email || !mobile || !subject || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Send email to user
    await transporter.sendMail(sendUserEmail(email, name));

    // Send email to admin
    await transporter.sendMail(sendAdminEmail({ name, email, mobile, subject, message }));

    res.status(200).json({ message: "✅ Form submitted successfully!" });
  } catch (error) {
    console.error("❌ Email Sending Error:", error);
    res.status(500).json({ error: "Error sending email" });
  }
});

// 📌 Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
