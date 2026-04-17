import { useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  TextField,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { format } from "date-fns";

interface EventEditDialogProps {
  open: boolean;
  initialStart: Date;
  initialEnd: Date;
  initialTitle?: string;
  initialLocation?: string;
  initialDescription?: string;
  initialAllDay?: boolean;
  onClose: () => void;
  onSave: (data: { title: string; start: Date; end: Date; location: string; description: string; allDay: boolean }) => void;
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

function formatDuration(minutes: number) {
  if (minutes <= 0) return "";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}:${String(m).padStart(2, "0")}h`;
}

function minutesToTime(m: number) {
  const clamped = Math.max(0, Math.min(24 * 60, m));
  return `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(clamped % 60).padStart(2, "0")}`;
}

export function EventEditDialog({ open, initialStart, initialEnd, initialTitle, initialLocation, initialDescription, initialAllDay, onClose, onSave }: EventEditDialogProps) {
  const theme = useTheme();
  const fullScreen = !useMediaQuery(theme.breakpoints.up("md"));
  const [title, setTitle] = useState(initialTitle ?? "");
  const [date, setDate] = useState(toDateInput(initialStart));
  const [endDate, setEndDate] = useState(toDateInput(initialEnd));
  const [startTime, setStartTime] = useState(toTimeInput(initialStart));
  const [endTime, setEndTime] = useState(() => {
    const startMin = timeToMinutes(toTimeInput(initialStart));
    const endMin = timeToMinutes(toTimeInput(initialEnd));
    return String(endMin <= startMin ? endMin + 24 * 60 : endMin);
  });
  const [allDay, setAllDay] = useState(initialAllDay ?? false);
  const [location, setLocation] = useState(initialLocation ?? "");
  const [description, setDescription] = useState(initialDescription ?? "");

  const handleStartChange = (newStart: string) => {
    const duration = Number(endTime) - timeToMinutes(startTime);
    setStartTime(newStart);
    setEndTime(String(timeToMinutes(newStart) + duration));
  };

  const handleEndChange = (newEnd: string) => {
    setEndTime(newEnd);
  };

  const endSlots = (() => {
    const startMin = timeToMinutes(startTime);
    const slots: { value: string; label: string; dur: number }[] = [];
    for (let offset = 15; offset <= 720; offset += 15) {
      const totalMin = startMin + offset;
      const wrapped = totalMin % (24 * 60);
      const time = minutesToTime(wrapped);
      const label = `${time} (${formatDuration(offset)})`;
      slots.push({ value: String(totalMin), label, dur: offset });
    }
    return slots;
  })();

  const handleSave = () => {
    const [sy, sm, sd] = date.split("-").map(Number);
    const [sh, smi] = startTime.split(":").map(Number);
    const endAbsMin = Number(endTime);
    const endDays = Math.floor(endAbsMin / (24 * 60));
    const endMinOfDay = endAbsMin % (24 * 60);
    let start: Date;
    let end: Date;
    if (allDay) {
      start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
      const [ey, em, ed] = endDate.split("-").map(Number);
      end = new Date(ey, em - 1, ed, 23, 59, 0, 0);
    } else {
      start = new Date(sy, sm - 1, sd, sh, smi);
      end = new Date(sy, sm - 1, sd + endDays, Math.floor(endMinOfDay / 60), endMinOfDay % 60);
    }
    onSave({ title: title || "(No title)", start, end, location, description, allDay });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      {fullScreen ? (
        <AppBar position="static" elevation={1}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={onClose} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {initialTitle ? "Edit Event" : "New Event"}
            </Typography>
            <Button color="inherit" onClick={handleSave}>Save</Button>
          </Toolbar>
        </AppBar>
      ) : (
        <DialogTitle sx={{ mt: 1 }}>{initialTitle ? "Edit Event" : "New Event"}</DialogTitle>
      )}
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            fullWidth
          />
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <TextField
              label={allDay ? "Start date" : "Date"}
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); if (endDate < e.target.value) setEndDate(e.target.value); }}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <FormControlLabel
              control={<Checkbox checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />}
              label="All day"
              sx={{ whiteSpace: "nowrap" }}
            />
          </Box>
          {allDay ? (
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <TextField
                label="End date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                fullWidth
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: date } }}
              />
              <Box sx={{ whiteSpace: "nowrap", visibility: "hidden" }}>
                <FormControlLabel
                  control={<Checkbox />}
                  label="All day"
                />
              </Box>
            </Box>
          ) : (
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
                {endSlots.map((s) => (
                  <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                ))}
              </TextField>
            </Box>
          )}
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
      {!fullScreen && (
        <DialogActions sx={{ px: 3, mt: -.5, mb: 1.5 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
