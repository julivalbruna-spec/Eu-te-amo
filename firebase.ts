
// FIX: Use Firebase v9 compat libraries to support mixed v8/v9 syntax across the project.
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";

// Configuração do Firebase com a chave de API fornecida.
export const firebaseConfig = {
  apiKey: "AIzaSyAnuwxtKmJmqz4adqAO9sJiy8LsPu662ZQ",
  authDomain: "absolute-theme-477418-f1.firebaseapp.com",
  projectId: "absolute-theme-477418-f1",
  storageBucket: "absolute-theme-477418-f1.firebasestorage.app",
  messagingSenderId: "425647336045",
  appId: "1:425647336045:web:4c7680293622e4344f2d64",
  measurementId: "G-TZ7249Y2PC"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const app = firebase.app();
export const auth = app.auth();
export const db = app.firestore();
export const storage = app.storage();

// --- MULTI-TENANT ABSTRACTION LAYER ---

// Default storeId for the primary store. This will be dynamic later.
const DEFAULT_STORE_ID = "iphonerios"; 

export const getCollectionRef = (collectionName: string, storeId: string | null = DEFAULT_STORE_ID): firebase.firestore.CollectionReference => {
    if (storeId) {
        return db.collection('stores').doc(storeId).collection(collectionName);
    }
    // Fallback to root-level collection during transition.
    // In a pure multi-tenant app, this branch would throw an error.
    return db.collection(collectionName);
};

export const getDocRef = (collectionName: string, docId: string, storeId: string | null = DEFAULT_STORE_ID): firebase.firestore.DocumentReference => {
    if (!docId) {
        console.error(`[getDocRef] Tentativa de acessar documento sem ID na coleção: ${collectionName}`);
        // Retorna uma referência para um ID fictício 'error' para evitar crash, mas loga o erro
        return db.collection('errors').doc('invalid_ref');
    }

    if (storeId) {
        return db.collection('stores').doc(storeId).collection(collectionName).doc(docId);
    }
    // Fallback
    return db.collection(collectionName).doc(docId);
};


// Apply Firestore settings to avoid transport errors and conflicts
try {
    db.settings({ 
        experimentalForceLongPolling: true,
        experimentalAutoDetectLongPolling: false,
        merge: true // Fix for "You are overriding the original host" warning
    } as any);
} catch (e) {
    console.warn("Firestore settings update failed (likely already initialized):", e);
}
