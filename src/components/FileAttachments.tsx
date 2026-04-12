import { useRef, useState, useCallback } from "react";
import { Box, Chip, Typography } from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";

interface FileAttachmentsProps {
  files: File[];
  onChange: (files: File[]) => void;
  children: React.ReactNode;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileAttachments({ files, onChange, children }: FileAttachmentsProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;
    const existing = new Set(files.map((f) => `${f.name}-${f.size}`));
    const toAdd = Array.from(newFiles).filter((f) => !existing.has(`${f.name}-${f.size}`));
    if (toAdd.length > 0) onChange([...files, ...toAdd]);
  }, [files, onChange]);

  const removeFile = useCallback((index: number) => {
    onChange(files.filter((_, i) => i !== index));
  }, [files, onChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  return (
    <Box
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={{
        position: "relative",
        border: dragOver ? "2px dashed" : "2px solid transparent",
        borderColor: dragOver ? "primary.main" : "transparent",
        borderRadius: 1,
        transition: "border-color 0.15s",
      }}
    >
      {children}

      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <Box
        onClick={() => inputRef.current?.click()}
        sx={{
          mt: 1,
          px: 1.5,
          py: 1,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 0.75,
          cursor: "pointer",
          minHeight: 40,
          "&:hover": { borderColor: "text.primary" },
        }}
      >
        <AttachFileIcon fontSize="small" color="action" />
        {files.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {dragOver ? "Drop files here" : "Attach files…"}
          </Typography>
        ) : (
          files.map((file, index) => (
            <Chip
              key={`${file.name}-${file.size}`}
              label={`${file.name} (${formatSize(file.size)})`}
              size="small"
              variant="outlined"
              onDelete={(e) => { e.stopPropagation(); removeFile(index); }}
            />
          ))
        )}
      </Box>
    </Box>
  );
}
