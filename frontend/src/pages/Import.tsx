import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { transactionApi } from '../api/client';
import { Upload, CheckCircle, XCircle } from 'lucide-react';

export default function Import() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    duplicates: number;
    errors: number;
    message: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Endast CSV-filer är tillåtna');
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Endast CSV-filer är tillåtna');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const response = await transactionApi.import(file, true);
      setResult(response);
      setFile(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Fel vid uppladdning');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Importera transaktioner
        </h2>

        {/* Drag and Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            Dra och släpp CSV-fil här
          </p>
          <p className="text-sm text-gray-600 mb-4">
            eller klicka för att välja fil
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
          >
            Välj fil
          </label>
        </div>

        {/* Selected File */}
        {file && (
          <div className="mt-4 flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-gray-900">{file.name}</span>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Ta bort
            </button>
          </div>
        )}

        {/* Upload Button */}
        {file && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {uploading ? 'Importerar...' : 'Importera'}
          </button>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
            <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Success Result */}
        {result && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-3 mb-3">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700 font-medium">{result.message}</p>
            </div>
            <div className="ml-8 space-y-1 text-sm text-gray-700">
              <p>✓ Importerade: {result.imported} transaktioner</p>
              <p>⊘ Dubbletter: {result.duplicates}</p>
              {result.errors > 0 && <p>✗ Fel: {result.errors}</p>}
            </div>
            <button
              onClick={() => navigate('/transactions')}
              className="mt-4 ml-8 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Visa transaktioner →
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            SEB CSV-format
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Ladda ner kontoutdrag från SEB i CSV-format</li>
            <li>• Filen ska innehålla kolumner: Datum, Beskrivning, Belopp</li>
            <li>• Dubbletter filtreras automatiskt bort</li>
            <li>• Transaktioner kategoriseras automatiskt om möjligt</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
