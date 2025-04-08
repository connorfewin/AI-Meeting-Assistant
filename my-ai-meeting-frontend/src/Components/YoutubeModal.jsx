// src/Components/YoutubeModal.jsx
import React, { useState, useRef } from "react";
import PropTypes from "prop-types";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import "../Styles/youtubeModal.css"; // Custom CSS for modal styling

// Helper to extract the YouTube video ID from a URL.
function extractVideoId(url) {
  const match = url.match(/(?:youtube\.com\/.*(?:\?|&)v=|youtu\.be\/)([^&]+)/);
  return match ? match[1] : null;
}

export const YoutubeModal = ({ open, onClose, onSuccess }) => {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      setError("Please provide a valid YouTube URL.");
      return;
    }

    setLoading(true);
    // Create an AbortController instance to enable cancellation.
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    try {
      const response = await fetch(
        `${process.env.REACT_APP_SOCKET_URL}/api/youtubeTranscript/${videoId}`,
        { signal: controller.signal }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch transcript from server");
      }
      const transcriptData = await response.json();
      if (!transcriptData.transcript || !Array.isArray(transcriptData.transcript)) {
        throw new Error("Invalid transcript data structure");
      }
      // Pass transcript data to the callback.
      onSuccess(transcriptData.transcript);
      setYoutubeUrl("");
      onClose();
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Fetch aborted");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    // Abort if a request is in progress.
    if (loading && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setYoutubeUrl("");
    setError(null);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel}>
      <DialogTitle>Enter YouTube URL</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {loading ? (
            <div className="loading-container">
              <CircularProgress />
              <p>Fetching transcript...</p>
            </div>
          ) : (
            <TextField
              autoFocus
              margin="dense"
              label="YouTube URL"
              type="url"
              fullWidth
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
            />
          )}
          {error && <p className="error-text">{error}</p>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
          {/* Only show the Submit button when not loading */}
          {!loading && <Button type="submit">Submit</Button>}
        </DialogActions>
      </form>
    </Dialog>
  );
};

YoutubeModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};
