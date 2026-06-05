'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, Trash2, Plus, Check } from 'lucide-react';
import Webcam from 'react-webcam';

type ScanResult = {
  item_name: string;
  price: number;
};

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<{ item_name: string; price: string }>({
    item_name: '',
    price: '',
  });
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const webcamRef = useRef<any>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedImage(url);
      setSelectedFile(file);
      // Reset scan results when new image is selected (but we keep previous results)
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedImage(url);
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleWebcamClick = () => {
    setIsWebcamOpen(true);
  };

  const handleWebcamClose = () => {
    setIsWebcamOpen(false);
    // Reset webcam ref
    if (webcamRef.current) {
      webcamRef.current.getScreenshot(); // This stops the webcam
    }
  };

  const handleWebcamCapture = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      // Convert base64 to File object
      const fetchUrl = imageSrc;
      fetch(fetchUrl)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'captured.jpg', { type: 'image/jpeg' });
          const url = URL.createObjectURL(file);
          setSelectedImage(url);
          setSelectedFile(file);
          setIsWebcamOpen(false);
        })
        .catch(err => {
          console.error('Error capturing image:', err);
          setError('Failed to capture image from webcam');
        });
    }
  };

  const handleScan = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/scan', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to scan receipt');
      }

      const result: ScanResult[] = await response.json();
      // Append new results to existing scanResults
      setScanResults(prev => [...prev, ...result]);
    } catch (err) {
      console.error('Scan error:', err);
      setError('Failed to scan receipt. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (index: number) => {
    setScanResults((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemNameChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    setScanResults((prev) => {
      const newArray = [...prev];
      newArray[index].item_name = e.target.value;
      return newArray;
    });
  };

  const handlePriceChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    setScanResults((prev) => {
      const newArray = [...prev];
      const value = e.target.value;
      // Allow empty or numeric only
      if (value === '' || !isNaN(parseFloat(value))) {
        newArray[index].price = value === '' ? 0 : parseFloat(value);
      }
      return newArray;
    });
  };

  const handleNewItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewItem((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const { item_name, price } = newItem;
    if (item_name.trim() !== '' && price !== '' && !isNaN(parseFloat(price))) {
      setScanResults((prev) => [
        ...prev,
        {
          item_name: item_name.trim(),
          price: parseFloat(price),
        },
      ]);
      setNewItem({ item_name: '', price: '' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-zinc-100 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-950 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
          S.A.V.O.R.I - Smart Receipt Scanner
        </h1>

        <div className="space-y-6">
          {/* Webcam Button */}
          <button
            onClick={handleWebcamClick}
            className="flex flex-col items-center justify-center w-full border-2 border-dashed border-amber-300 dark:border-amber-400 rounded-lg p-8 hover:border-amber-400 dark:hover:border-amber-300 transition-colors hover:bg-amber-50 dark:hover:bg-amber-900/20 cursor-pointer"
          >
            <Camera className="h-10 w-10 text-amber-500 mb-3" />
            <span className="text-black dark:text-white font-medium">Buka Kamera</span>
          </button>

          {/* Drag and Drop Upload Area */}
          <label
            htmlFor="upload-input"
            className={`flex flex-col items-center justify-center w-full border-2 border-dashed
              ${isDragOver
                ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:border-amber-300 dark:hover:bg-amber-900/30'
                : 'border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:bg-zinc-50'}
              rounded-lg p-8 cursor-pointer transition-all duration-200`}
          >
            <input
              id="upload-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <Upload className="h-10 w-10 text-amber-500 mb-3" />
            <span className="text-black dark:text-white font-medium">
              {isDragOver ? 'Lepaskan File Disini' : 'Upload Struk'}
            </span>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Atau seret &amp; letakkan file di sini
            </p>
          </label>
        </div>

        {/* Webcam Modal */}
        {isWebcamOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="relative bg-white dark:bg-zinc-800 rounded-xl p-6 w-[90vw] max-w-md">
              <button
                onClick={handleWebcamClose}
                className="absolute top-3 right-3 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                <Trash2 className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-semibold mb-4 text-black dark:text-white text-center">
                Ambil Foto dari Webcam
              </h2>
              <div className="relative w-full h-[300px] bg-zinc-100 dark:bg-zinc-700 rounded-lg overflow-hidden mb-4">
                <Webcam
                  ref={webcamRef}
                  videoConstraints={{
                    width: 640,
                    height: 480,
                    facingMode: "environment"
                  }}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex justify-center">
                <button
                  onClick={handleWebcamCapture}
                  className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                  Ambil Foto
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview Section */}
        {selectedImage && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">
              Preview Gambar
            </h2>
            <div className="relative">
              <img
                src={selectedImage}
                alt="Preview struk"
                className="max-w-full h-auto rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-lg"
              />
              {!isWebcamOpen && (
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setSelectedFile(null);
                  }}
                  className="absolute top-2 right-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded-full p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Scan Button */}
        {selectedFile && (
          <div className="mt-6">
            <button
              onClick={handleScan}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 focus:outline-none focus:ring-2 focus-ring-amber-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <Plus className="animate-spin h-4 w-4" />
                  Sedang memindai...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Scan Struk Sekarang
                </>
              )}
            </button>
            {error && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </div>
        )}

        {/* Results Table - Always Shown */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">
            Hasil Scan
          </h2>
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg overflow-hidden">
            {scanResults.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
                    <thead className="bg-gradient-to-r from-amber-50 via-amber-100 to-white dark:from-amber-900 dark:via-amber-800 dark:to-zinc-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                          Nama Barang
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                          Harga
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                      {scanResults.map((item, index) => (
                        <tr key={index} className="hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              value={item.item_name}
                              onChange={(e) => handleItemNameChange(index, e)}
                              className="block w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-300 text-sm dark:bg-zinc-700 dark:text-white"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              value={item.price}
                              step="0.01"
                              min="0"
                              onChange={(e) => handlePriceChange(index, e)}
                              className="block w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-300 text-sm dark:bg-zinc-700 dark:text-white"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleDelete(index)}
                              className="text-red-600 hover:text-red-900 dark:hover:text-red-200 hover:underline"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add New Item Form */}
                <form
                  onSubmit={handleAddItem}
                  className="mt-6 flex flex-col sm:flex-row gap-4 p-6 bg-amber-50 dark:bg-amber-900/20"
                >
                  <div className="flex-1 min-w-0">
                    <label className="block text-sm font-medium text-black dark:text-white mb-1">
                      Nama Barang Baru
                    </label>
                    <input
                      type="text"
                      name="item_name"
                      value={newItem.item_name}
                      onChange={handleNewItemChange}
                      placeholder="Misalnya: Nasi Goreng"
                      className="block w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-300 text-sm dark:bg-zinc-700 dark:text-white"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-sm font-medium text-black dark:text-white mb-1">
                      Harga (Rp)
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={newItem.price}
                      onChange={handleNewItemChange}
                      placeholder="0.00"
                      className="block w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-300 text-sm dark:bg-zinc-700 dark:text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-500 text-white font-medium rounded-md hover:from-amber-700 hover:to-orange-600 focus:outline-none focus:ring-2 focus-ring-amber-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    Tambah Item
                  </button>
                </form>
              </>
            ) : (
              <div className="py-12 text-center">
                <p className="text-zinc-500 dark:text-zinc-400">
                  Belum ada data barang. Scan sebuah struk untuk melihat hasil di sini.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}