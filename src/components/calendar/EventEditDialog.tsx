import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";
import { format } from "date-fns";

interface EventEditDialogProps {
  open: boolean;
  initialStart: Date;
  initialEnd: Date;
  onClose: () => void;
  onSave: (data: { title: string; start: Date; end: Date; location: string; description: string }) => void;
}

function toTimeInput(d: Date) {
  return format(d, "HH:mm");
}

function toDateInput(d: Date) {
  return format(d, "yyyy-MM-dd");
}

const TIME_SLOTS = (() => {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  slots.push("24:00");
  return slots;
})();

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number) {
  const clamped = Math.max(0, Math.min(24 * 60, m));
  return `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(clamped % 60).padStart(2, "0")}`;
}

export function EventEditDialog({ open, initialStart, initialEnd, onClose, onSave }: EventEditDialogProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(toDateInput(initialStart));
  const [startTime, setStartTime] = useState(toTimeInput(initialStart));
  const [endTime, setEndTime] = useState(toTimeInput(initialEnd));
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  const handleStartChange = (newStart: string) => {
    const duration = timeToMinutes(endTime) - timeToMinutes(startTime);
    setStartTime(newStart);
    setEndTime(minutesToTime(timeToMinutes(newStart) + duration));
  };

  const handleEndChange = (newEnd: string) => {
    setEndTime(newEnd);
  };

  const handleSave = () => {
    const [sy, sm, sd] = date.split("-").map(Number);
    const [sh, smi] = startTime.split(":").map(Number);
    const [eh, emi] = endTime.split(":").map(Number);
    const start = new Date(sy, sm - 1, sd, sh, smi);
    const end = new Date(sy, sm - 1, sd, eh, emi);
    onSave({ title: title || "(No title)", start, end, location, description });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>New Event</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            fullWidth
          />
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="Start"
              select
              value={startTime}
              onChange={(e) => handleStartChange(e.target.value)}
              fullWidth
            >
              {TIME_SLOTS.map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="End"
              select
              value={endTime}
              onChange={(e) => handleEndChange(e.target.value)}
              fullWidth
            >
              {TIME_SLOTS.map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </TextField>
          </Box>
          <TextField
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            fullWidth
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            minRows={3}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}
