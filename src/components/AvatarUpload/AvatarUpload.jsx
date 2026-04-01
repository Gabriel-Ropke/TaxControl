import { useState, useRef } from "react";
import { Camera } from "lucide-react";
import { generateColor } from "../../utils/generateColor";
import { getInitials } from "../../utils/formatters";
import "./avatarUpload.css";

const MAX_SIZE_MB = 8;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function AvatarUpload({ username, currentAvatar, onUpload }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  
  const { color, alphaColor } = generateColor(username || "U");
  
  const handleClick = () => fileInputRef.current?.click();
  
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setError(null);
    
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Apenas imagens (JPG, PNG, WebP, GIF) são permitidas.");
      e.target.value = "";
      return;
    }
    
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Tamanho máximo: ${MAX_SIZE_MB}MB`);
      e.target.value = "";
      return;
    }
    
    setUploading(true);
    try {
      await onUpload(file);
    } catch (err) {
      setError("Erro ao fazer upload.");
      console.error("Erro ao upload:", err);
    }
    setUploading(false);
    e.target.value = "";
  };
  
  return (
    <div className="avatar-upload-container" onClick={handleClick}>
      {currentAvatar ? (
        <img src={currentAvatar} alt="Avatar" className="avatar-image" />
      ) : (
        <div className="avatar-placeholder" style={{ background: color }}>
          <span>{getInitials(username || "U")}</span>
        </div>
      )}
      <div className="avatar-overlay">
        {uploading ? (
          <span className="uploading">...</span>
        ) : (
          <Camera size={24} />
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      {error && <span className="avatar-error">{error}</span>}
    </div>
  );
}