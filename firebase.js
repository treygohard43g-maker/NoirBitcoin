import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDrlrpKrSLXivCOuXFpH4L7cxsg7QI_x9E",
  authDomain: "noirbitcoin-f05ff.firebaseapp.com",
  projectId: "noirbitcoin-f05ff",
  storageBucket: "noirbitcoin-f05ff.firebasestorage.app",
  messagingSenderId: "735484509737",
  appId: "1:735484509737:web:9a9fe56f628dc96a14e638"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);