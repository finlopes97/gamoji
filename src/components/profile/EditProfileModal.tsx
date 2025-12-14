"use client";

import { useState } from "react";
import { updateUsername } from "@/app/actions/profile";
import { Pencil, Save, X, Loader2 } from "lucide-react";

export function EditProfileButton({ currentName }: { currentName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    setLoading(true);
    
    const result = await updateUsername(name);
    
    setLoading(false);
    if (result.success) {
      setIsOpen(false);
    } else {
      setError(result.message || "Failed to update");
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
        title="Edit Username"
      >
        <Pencil className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-sm animate-in zoom-in-95">
        <h3 className="font-bold text-lg mb-4">Update Username</h3>
        
        <div className="space-y-4">
          <div>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
              placeholder="Enter new username"
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>
          
          <div className="flex gap-2 justify-end">
            <button 
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={loading || name.length < 3}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}