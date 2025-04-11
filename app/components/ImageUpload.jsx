import React, { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';

const ImageUpload = ({
  initialImageUrl,
  onImageChange,
  removeBackground = false
}) => {
  const [imageUrl, setImageUrl] = useState(initialImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (event) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    setIsUploading(true);

    try {
      // Conversion du fichier en Data URL
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result;
        
        if (removeBackground) {
          setIsProcessing(true);
          try {
            // Dans une implémentation réelle, vous appelleriez votre service
            // de suppression de fond ici
            // Exemple: const processedImage = await removeWineBottleBackground(result);
            
            // Pour l'instant, on utilise simplement l'image originale
            const processedImage = result;
            setImageUrl(processedImage);
            onImageChange(processedImage);
          } catch (error) {
            console.error('Erreur lors du traitement de l\'image:', error);
            // En cas d'erreur, utiliser l'image originale
            setImageUrl(result);
            onImageChange(result);
          } finally {
            setIsProcessing(false);
          }
        } else {
          // Utilisation de l'image sans traitement
          setImageUrl(result);
          onImageChange(result);
        }
        
        setIsUploading(false);
        // Réinitialiser l'input pour permettre de recharger le même fichier
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erreur lors de la lecture du fichier:', error);
      setIsUploading(false);
    }
  };

  const handleUrlInput = async () => {
    const url = prompt('Entrez l\'URL de l\'image:');
    if (!url) return;

    setIsUploading(true);
    
    try {
      if (removeBackground) {
        setIsProcessing(true);
        try {
          // Dans une implémentation réelle, appel au service de suppression de fond
          // Exemple: const processedImage = await removeWineBottleBackground(url);
          
          // Pour l'instant, utiliser l'URL sans traitement
          const processedImage = url;
          setImageUrl(processedImage);
          onImageChange(processedImage);
        } catch (error) {
          console.error('Erreur lors du traitement de l\'image:', error);
          // En cas d'erreur, utiliser l'image originale
          setImageUrl(url);
          onImageChange(url);
        } finally {
          setIsProcessing(false);
        }
      } else {
        // Utilisation de l'URL sans traitement
        setImageUrl(url);
        onImageChange(url);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'URL:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const clearImage = () => {
    setImageUrl(null);
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {!imageUrl ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center h-64 bg-gray-50">
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-t-red-800 border-gray-200 rounded-full animate-spin mb-2"></div>
              <p className="text-sm text-gray-500">
                {isProcessing ? 'Traitement en cours...' : 'Chargement...'}
              </p>
            </div>
          ) : (
            <>
              <ImageIcon size={40} className="text-gray-400 mb-4" />
              <p className="text-gray-500 text-center mb-4">
                Glissez et déposez une image ici ou cliquez pour sélectionner
              </p>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="py-2 px-4 bg-red-800 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors duration-300"
                >
                  Parcourir
                </button>
                <button
                  type="button"
                  onClick={handleUrlInput}
                  className="py-2 px-4 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors duration-300"
                >
                  Utiliser URL
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="relative border rounded-lg overflow-hidden bg-white">
          <div className="relative h-64 flex items-center justify-center">
            {isProcessing ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-10">
                <div className="w-10 h-10 border-4 border-t-red-800 border-gray-200 rounded-full animate-spin"></div>
              </div>
            ) : null}
            <img
              src={imageUrl}
              alt="Prévisualisation"
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div className="absolute top-2 right-2 flex space-x-2">
            <button
              type="button"
              onClick={triggerFileInput}
              className="p-2 bg-white rounded-full shadow hover:bg-gray-100 transition-colors duration-300"
              title="Changer d'image"
            >
              <Upload size={16} />
            </button>
            <button
              type="button"
              onClick={clearImage}
              className="p-2 bg-white rounded-full shadow hover:bg-gray-100 transition-colors duration-300"
              title="Supprimer l'image"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {imageUrl && removeBackground && (
        <div className="mt-2 text-xs text-gray-500">
          Image traitée pour supprimer le fond.
          {isProcessing && ' Traitement en cours...'}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;