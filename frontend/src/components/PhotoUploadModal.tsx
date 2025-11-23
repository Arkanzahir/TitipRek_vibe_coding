import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { useState } from "react";

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (photo: File) => void;
  title: string;
  description: string;
  buttonText: string;
}

export const PhotoUploadModal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  buttonText,
}: PhotoUploadModalProps) => {
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPhoto(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = () => {
    if (selectedPhoto) {
      onSubmit(selectedPhoto);
      setSelectedPhoto(null);
      setPreviewUrl("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{description}</p>
          
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover rounded-lg mb-4" />
            ) : (
              <Camera className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            )}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="hidden"
              id="photo-upload"
            />
            <label htmlFor="photo-upload">
              <Button type="button" variant="outline" asChild>
                <span>{previewUrl ? "Ganti Foto" : "Ambil Foto"}</span>
              </Button>
            </label>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!selectedPhoto}
            className="w-full"
          >
            {buttonText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
