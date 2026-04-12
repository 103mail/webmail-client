import { useRef, useState, useCallback } from "react";
import { Box, Chip, Typography } from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";

interface FileAttachmentsProps {
  files: File[];
  onChange: (files: File[]) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileAttachments({ files, onChange }: FileAttachmentsProps) {
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

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
      />

      <Box
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        sx={{
          px: 1.5,
          py: 1,
          border: "1px solid",
          borderColor: dragOver ? "primary.main" : "action.disabled",
          bgcolor: dragOver ? "rgba(25, 118, 210, 0.08)" : "transparent",
          borderRadius: 1,
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 0.75,
          cursor: "pointer",
          minHeight: 40,
          transition: "border-color 0.15s, background-color 0.15s",
          "&:hover": { borderColor: "text.primary" },
        }}
      >
        <AttachFileIcon fontSize="small" color={dragOver ? "primary" : "action"} />
        {files.length === 0 ? (
          <Typography variant="body1" sx={{ color: dragOver ? "primary.main" : "text.disabled" }}>
            {dragOver ? "Drop here" : "Attach files…"}
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
    </>
  );
}
