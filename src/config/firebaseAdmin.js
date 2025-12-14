import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read JSON file
const serviceAccount = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "firebase-admin.json"),
    "utf8"
  )
);

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
