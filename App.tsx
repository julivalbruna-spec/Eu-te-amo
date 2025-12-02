
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import StorePage from './pages/StorePage';
import BioPage from './pages/BioPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import ProductPage from './pages/ProductPage';
import CheckoutStoryPage from './pages/CheckoutStoryPage';
import SorteioPage from './pages/SorteioPage';
import ProtectedRoute from './components/ProtectedRoute';
import { storage, auth, getDocRef } from './firebase';
import { SiteInfo } from './types';
import { SITE_INFO as defaultSiteInfo } from './constants';
import ThemeStyle from './components/ThemeStyle';
import { useAuth } from './components/AuthContext';
import { StoreProvider } from './contexts/StoreContext';
import { useStore } from './contexts/StoreContext';
import Preloader from './components/Preloader';

// Declare heic2any as global since it is loaded via script tag
declare var heic2any: any;

declare global {
  interface Window {
    uploadImage: (file: File, onProgress?: (progress: number) => void, optimizationType?: 'product' | 'hero') => Promise<string>;
  }
}

const isObject = (item: any): item is object => {
  return (item && typeof item === 'object' && !Array.isArray(item));
};

const deepMerge = (target: any, source: any): any => {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      const sourceValue = source[key];
      const targetValue = target[key];

      if (sourceValue === null || sourceValue === undefined) {
        // If source has null/undefined, do nothing and keep the target's value.
        return;
      }
      
      if (Array.isArray(targetValue)) {
        // If the target value is an array, we'll only accept an array from the source.
        if (Array.isArray(sourceValue)) {
          output[key] = sourceValue;
        }
        // If sourceValue is not an array, we do nothing, preserving the target's array.
      } else if (isObject(targetValue) && isObject(sourceValue)) {
        // If both are objects (and not arrays), we recurse.
        output[key] = deepMerge(targetValue, sourceValue);
      } else {
        // For all other types (string, number, boolean), we just assign the source value.
        output[key] = sourceValue;
      }
    });
  }

  return output;
};

// --- IMAGE OPTIMIZATION UTILITY ---
const resizeImage = async (file: File, type: 'product' | 'hero' = 'product'): Promise<Blob> => {
    // HEIC Conversion Logic
    let sourceFile = file;
    const isHeic = file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic' || file.type === 'image/heif';
    
    if (isHeic && typeof heic2any !== 'undefined') {
        try {
            const blobOrBlobs = await heic2any({
                blob: file,
                toType: 'image/jpeg',
                quality: 0.9
            });
            
            const convertedBlob = Array.isArray(blobOrBlobs) ? blobOrBlobs[0] : blobOrBlobs;
            sourceFile = new File([convertedBlob], file.name.replace(/\.heic$/i, ".jpg"), { type: "image/jpeg" });
        } catch (e) {
            console.error("HEIC conversion failed:", e);
            // Fallback to trying to process original file, though likely to fail in standard pipeline
        }
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Define constraints based on type
                // Product: stricter limit to ensure <1MB and fast loading
                // Hero: higher limit for crisp banners on large screens
                const MAX_WIDTH = type === 'hero' ? 2560 : 1080; 
                const MAX_HEIGHT = type === 'hero' ? 2560 : 1080;
                const QUALITY = type === 'hero' ? 0.92 : 0.8;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error("Failed to get canvas context"));
                    return;
                }
                
                // Use better interpolation for resizing
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                // FIX: Robust PNG detection to preserve transparency (check sourceFile now)
                const isPng = sourceFile.type === 'image/png' || sourceFile.name.toLowerCase().endsWith('.png');
                
                // Clear canvas to ensure transparency works for PNGs
                ctx.clearRect(0, 0, width, height);
                
                ctx.drawImage(img, 0, 0, width, height);
                
                const outputType = isPng ? 'image/png' : 'image/jpeg';
                
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error("Canvas conversion failed"));
                    }
                }, outputType, QUALITY);
            };
            img.onerror = reject;
            if (typeof event.target?.result === 'string') {
                img.src = event.target.result;
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(sourceFile);
    });
};


const App: React.FC = () => {
    const { currentUser } = useAuth();
    const { storeId, loading: storeLoading } = useStore();
    const [siteInfo, setSiteInfo] = useState<SiteInfo>(defaultSiteInfo);

  useEffect(() => {
    // Expose uploadImage globally for easier access in admin components
    window.uploadImage = async (file: File, onProgress?: (progress: number) => void, optimizationType: 'product' | 'hero' = 'product'): Promise<string> => {
      if (!auth.currentUser) {
        throw new Error("Usuário não autenticado");
      }

      try {
          // Optimize image before upload if it's an image
          let fileToUpload: Blob | File = file;
          let fileName = file.name;
          
          // Check for images, including HEIC
          const isImage = file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.heic');

          // Skip SVG or non-image files
          if (isImage && !file.type.includes('svg')) {
              try {
                  // Resize and compress based on optimization type (HEIC conversion happens inside resizeImage)
                  fileToUpload = await resizeImage(file, optimizationType);
                  
                  // FIX: Update extension based on the actual blob type to match png/jpg correctly
                  const isPng = fileToUpload.type === 'image/png';
                  const ext = isPng ? '.png' : '.jpg';
                  // Remove existing extension (including .heic) and append new one
                  fileName = fileName.replace(/\.[^/.]+$/, "") + ext;
                  
              } catch (e) {
                  console.warn("Image optimization failed, uploading original.", e);
              }
          }

          return new Promise((resolve, reject) => {
              const userId = auth.currentUser!.uid;
              const timestamp = Date.now();
              const uniqueFileName = `${timestamp}_${fileName}`;
              const storageRef = storage.ref(`uploads/${userId}/${uniqueFileName}`);
              const uploadTask = storageRef.put(fileToUpload);

              uploadTask.on(
                  'state_changed',
                  (snapshot) => {
                      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                      if (onProgress) {
                          onProgress(progress);
                      }
                  },
                  (error) => {
                      console.error("Upload failed:", error);
                      reject("Erro ao enviar imagem.");
                  },
                  () => {
                      uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                          resolve(downloadURL);
                      }).catch(error => {
                          console.error("Failed to get download URL:", error);
                          reject("Erro ao obter URL da imagem.");
                      });
                  }
              );
          });
      } catch (err) {
          console.error("Upload process failed", err);
          throw err;
      }
    };

    if (!storeId) return;

    // Fetch Site Info using the new abstraction layer
    const siteInfoRef = getDocRef('settings', 'siteInfo', storeId);
    const unsubscribe = siteInfoRef.onSnapshot(
        (doc) => {
            if (doc.exists) {
                const fetchedData = doc.data();
                const mergedInfo = deepMerge(defaultSiteInfo, fetchedData);
                setSiteInfo(mergedInfo);
                localStorage.setItem(`siteInfo_${storeId}`, JSON.stringify(mergedInfo));
            } else {
                setSiteInfo(defaultSiteInfo);
                localStorage.setItem(`siteInfo_${storeId}`, JSON.stringify(defaultSiteInfo));
            }
        },
        (error) => {
            console.error("Error fetching site info:", error);
            try {
                const storedInfo = localStorage.getItem(`siteInfo_${storeId}`);
                if (storedInfo) {
                    setSiteInfo(JSON.parse(storedInfo));
                }
            } catch (e) {
                console.error("Failed to parse site info from localStorage", e);
            }
        }
    );

    return () => unsubscribe();
  }, [currentUser, storeId]);

  useEffect(() => {
    // Update Favicon
    const favicon = document.getElementById('favicon') as HTMLLinkElement | null;
    if (favicon && siteInfo.faviconUrl) {
      favicon.href = siteInfo.faviconUrl;
    }

    // Update SEO Meta Tags
    if (siteInfo.seo) {
      document.title = siteInfo.seo.metaTitle;

      const updateMetaTag = (selector: string, content: string) => {
        const element = document.querySelector(selector) as HTMLMetaElement | null;
        if (element) {
          element.content = content;
        }
      };

      updateMetaTag('meta[name="description"]', siteInfo.seo.metaDescription);
      updateMetaTag('meta[name="keywords"]', siteInfo.seo.metaKeywords);
      updateMetaTag('meta[property="og:title"]', siteInfo.seo.metaTitle);
      updateMetaTag('meta[property="og:description"]', siteInfo.seo.metaDescription);
      if (siteInfo.seo.ogImage) {
        updateMetaTag('meta[property="og:image"]', siteInfo.seo.ogImage);
      }
    }
  }, [siteInfo]);

  if (storeLoading) {
      return <Preloader />;
  }
  
  // If user is logged in but has no store assigned, show access denied.
  if (currentUser && !storeId) {
      return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center text-center p-4">
                <h2 className="text-2xl font-bold mb-4">Acesso Negado</h2>
                <p className="text-gray-400 max-w-md">Sua conta não está associada a nenhuma loja. Por favor, entre em contato com o super administrador para obter acesso.</p>
                <button onClick={() => auth.signOut()} className="mt-6 bg-yellow-500 text-black font-bold py-2 px-6 rounded-lg hover:bg-yellow-400 transition-colors">
                    Sair
                </button>
            </div>
      );
  }
  
  // This should not happen if logic is correct, but as a fallback.
  if (!storeId) {
      return <Preloader />;
  }


  return (
    <>
      <ThemeStyle 
        theme={siteInfo.theme} 
        bannerTransitionDuration={siteInfo.bannerTransitionDuration} 
        storeLayout={siteInfo.storeLayout} 
        chatWidget={siteInfo.chatWidget} 
      />
      <HashRouter>
        <Routes>
          <Route path="/" element={<StorePage storeId={storeId} />} />
          <Route path="/product/:productId" element={<ProductPage storeId={storeId} />} />
          <Route path="/checkout-story/:productId" element={<CheckoutStoryPage storeId={storeId} />} />
          <Route path="/sorteio/:sorteioId" element={<SorteioPage storeId={storeId} />} />
          <Route path="/bio" element={<BioPage storeId={storeId} />} />
          <Route path="/login" element={<LoginPage storeId={storeId} />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminPage storeId={storeId} />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </HashRouter>
    </>
  );
};

export default App;
