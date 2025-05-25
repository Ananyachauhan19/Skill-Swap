import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDTmqGVObevd-5CmXjJuwgkCvJe3rthKhU",
  authDomain: "skillswap-c90c6.firebaseapp.com",
  projectId: "skillswap-c90c6",
  storageBucket: "skillswap-c90c6.firebasestorage.app",
  messagingSenderId: "609213277424",
  appId: "1:609213277424:web:b5003cfbb519a54c240e35",
  measurementId: "G-SFMP1MJ4N9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const db = getFirestore(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

console.log("auth:", auth);


// Setup reCAPTCHA for phone number login (SMS)
export const setupRecaptcha = (containerId = 'recaptcha-container', authInstance = auth) => {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(
      containerId,
      {
        size: 'invisible',
        callback: (response) => {
          // reCAPTCHA solved
          console.log("reCAPTCHA verified");
        },
        'expired-callback': () => {
          // Response expired
          console.warn("reCAPTCHA expired, please retry.");
        }
      },
      authInstance
    );
  }
  return window.recaptchaVerifier;
};

// Send OTP (SMS) to phone number
export const signInWithPhone = (phoneNumber, appVerifier, authInstance = auth) => {
  return signInWithPhoneNumber(authInstance, phoneNumber, appVerifier);
};
