import { useEffect, useRef, useState } from "react";
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import VerifiedIcon from "@mui/icons-material/Verified";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";

export type NotificationFrequency = "hourly" | "daily" | "weekly" | "none";

export interface AccountProfile {
  fullName: string;
  notificationEmail: string;
  verifiedNotificationEmail: string;
  notificationFrequency: NotificationFrequency;
  avatarDataUrl?: string;
}

interface AccountScreenProps {
  open: boolean;
  profile: AccountProfile;
  onClose: () => void;
  onSave: (next: AccountProfile) => void;
}

const FREQUENCIES: { value: NotificationFrequency; label: string }[] = [
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "none", label: "None" },
];

export function AccountScreen({ open, profile, onClose, onSave }: AccountScreenProps) {
  const theme = useTheme();
  const fullScreen = !useMediaQuery(theme.breakpoints.up("md"));

  const [fullName, setFullName] = useState(profile.fullName);
  const [notificationEmail, setNotificationEmail] = useState(profile.notificationEmail);
  const [frequency, setFrequency] = useState<NotificationFrequency>(profile.notificationFrequency);
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | undefined>(profile.avatarDataUrl);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setFullName(profile.fullName);
      setNotificationEmail(profile.notificationEmail);
      setFrequency(profile.notificationFrequency);
      setAvatarDataUrl(profile.avatarDataUrl);
    }
  }, [open, profile]);

  const handlePickAvatar = () => fileInputRef.current?.click();

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setAvatarDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => setAvatarDataUrl(undefined);

  const initials = (fullName || notificationEmail || "?")
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  const isVerified =
    notificationEmail.length > 0 &&
    notificationEmail === profile.verifiedNotificationEmail;
  const pendingVerification =
    notificationEmail.length > 0 && !isVerified;

  const canSave =
    fullName !== profile.fullName ||
    notificationEmail !== profile.notificationEmail ||
    frequency !== profile.notificationFrequency ||
    avatarDataUrl !== profile.avatarDataUrl;

  const handleSave = () => {
    onSave({
      fullName: fullName.trim(),
      notificationEmail: notificationEmail.trim(),
      verifiedNotificationEmail: profile.verifiedNotificationEmail,
      notificationFrequency: frequency,
      avatarDataUrl,
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="sm"
    >
      {fullScreen ? (
        <AppBar position="static" elevation={1}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={onClose} sx={{ mr: 1 }} aria-label="back">
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>Account</Typography>
            <Button color="inherit" onClick={handleSave} disabled={!canSave}>Save</Button>
          </Toolbar>
        </AppBar>
      ) : (
        <DialogTitle sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1, pr: 2 }}>
          <Box sx={{ flexGrow: 1 }}>Account</Box>
          <IconButton onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
      )}
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ position: "relative" }}>
              <Avatar
                src={avatarDataUrl}
                sx={{ width: 80, height: 80, fontSize: 28 }}
              >
                {!avatarDataUrl && initials}
              </Avatar>
              <IconButton
                size="small"
                onClick={handlePickAvatar}
                aria-label="upload profile image"
                sx={{
                  position: "absolute",
                  right: -4,
                  bottom: -4,
                  bgcolor: "background.paper",
                  border: 1,
                  borderColor: "divider",
                  "&:hover": { bgcolor: "background.paper" },
                }}
              >
                <PhotoCameraIcon fontSize="small" />
              </IconButton>
            </Box>
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                Profile image
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button size="small" onClick={handlePickAvatar}>
                  Upload
                </Button>
                {avatarDataUrl && (
                  <Button size="small" color="inherit" onClick={handleRemoveAvatar}>
                    Remove
                  </Button>
                )}
              </Box>
            </Stack>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleAvatarFile}
            />
          </Box>

          <TextField
            label="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            fullWidth
            autoComplete="name"
          />

          <TextField
            label="Notification email"
            value={notificationEmail}
            onChange={(e) => setNotificationEmail(e.target.value)}
            type="email"
            fullWidth
            autoComplete="email"
            helperText={
              pendingVerification
                ? `Pending verification. Current verified address: ${profile.verifiedNotificationEmail || "(none)"}`
                : "Verified"
            }
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    {isVerified ? (
                      <Tooltip title="Verified">
                        <VerifiedIcon color="success" aria-label="verified" />
                      </Tooltip>
                    ) : (
                      <Tooltip title="Pending verification">
                        <HourglassEmptyIcon color="warning" aria-label="pending verification" />
                      </Tooltip>
                    )}
                  </InputAdornment>
                ),
              },
            }}
          />

          {pendingVerification && (
            <Alert severity="info">
              Saving will record the new address as requested. It will be verified once you confirm it via the link we send there.
            </Alert>
          )}

          <Box>
            <Typography variant="body2" sx={{ mb: 1, color: "text.secondary" }}>
              Notification frequency
            </Typography>
            <ToggleButtonGroup
              exclusive
              value={frequency}
              onChange={(_e, val: NotificationFrequency | null) => val && setFrequency(val)}
              aria-label="notification frequency"
              fullWidth
              color="primary"
            >
              {FREQUENCIES.map((f) => (
                <ToggleButton key={f.value} value={f.value} aria-label={f.label}>
                  {f.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

        </Stack>
      </DialogContent>
      {!fullScreen && (
        <DialogActions sx={{ px: 3, mt: -.5, mb: 1.5 }}>
          <Button variant="contained" onClick={handleSave} disabled={!canSave}>Save</Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
