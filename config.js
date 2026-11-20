window.appConfig = {
    firebaseConfig: {
       apiKey: process.env.FIREBASE_API_KEY,
       authDomain: process.env.FIREBASE_AUTH_DOMAIN,
       projectId: process.env.FIREBASE_PROJECT_ID,
       storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
       messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
       appId: process.env.FIREBASE_APP_ID,
       measurementId: process.env.FIREBASE_MEASUREMENT_ID
    },
    backendEmail: {
        enabled: true,
        // Replace <your-vercel-project> with the actual Vercel deployment domain
        sendFeedbackUrl: 'https://<your-vercel-project>.vercel.app/api/sendFeedback'
    }
};
