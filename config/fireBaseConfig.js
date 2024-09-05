const admin = require("firebase-admin");

const serviceAccount = require('../hire2inspire-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  storageBucket: process.env.BUCKET_URL,
});

const bucket = admin.storage().bucket();

module.exports = {
  admin,
  bucket,
};
