const router = require("express").Router();
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/images");
    },
    filename: (req, file, cb) => {
        // Use originalname or unique name. Spec response example: "filename": "upl_123.jpg"
        // Let's use Date.now() + originalname to avoid conflicts
        cb(null, req.body.name || Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

router.post("/", upload.single("file"), (req, res) => {
    try {
        return res.status(200).json({
            filename: req.file.filename,
            url: `/images/${req.file.filename}` // Assuming we serve public/images at /images
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json("File upload failed");
    }
});

module.exports = router;
