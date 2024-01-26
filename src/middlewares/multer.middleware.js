import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    let fileextension;
    if (file.originalname.split(".") > 1) {
      fileextension = file.originalname.substring(
        file.originalname.lastIndexOf(".")
      );
    }
    const fileNameWithoutExtension = file.originalname
      .toLowerCase()
      .split(" ")
      .join("-")
      ?.split(".")[0];
    cb(
      null,
      fileNameWithoutExtension +
        Date.now() +
        Math.ceil(Math.random() * 1e5) +
        fileextension
    );
  },
});

export const upload = multer({ storage: storage });
