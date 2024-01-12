const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");

const app = express();
const port = 3001;

// Set up multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.json());

// Define a route for processing audio
app.post("/process-audio", upload.single("audioFile"), (req, res) => {
  try {
    // Access the audio buffer from the uploaded file
    const audioBuffer = req.file.buffer;

    // Implement filler word detection and removal logic
    const processedAudioBuffer = processAudio(
      audioBuffer,
      req.body.fillerWordSensitivity,
      req.body.silenceThreshold
    );

    // Save the processed audio to a temporary file
    const processedAudioPath = "path/to/processed-audio.mp3";
    fs.writeFileSync(processedAudioPath, processedAudioBuffer);

    // Respond with the path to the processed audio file
    res.json({ processedAudio: processedAudioPath });
  } catch (error) {
    console.error("Error processing audio:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Function to process audio using ffmpeg
function processAudio(audioBuffer, fillerWordSensitivity, silenceThreshold) {
  // Convert audio buffer to a temporary input file
  const inputFilePath = "path/to/temp-input.wav";
  fs.writeFileSync(inputFilePath, audioBuffer);

  // Define filler word removal and silence minimization filters
  const filters = [
    `silencedetect=n=${silenceThreshold}:d=0.5`, // Detect silences
    "loudnorm=i=-16", // Apply loudness normalization
    `afftdn=nt=w:s=${fillerWordSensitivity}`, // Filler word removal
  ];

  // Execute ffmpeg command
  const outputBuffer = ffmpeg()
    .input(inputFilePath)
    .audioFilters(filters)
    .audioCodec("libmp3lame")
    .format("mp3")
    .toFormat("mp3")
    .pipe();

  return outputBuffer;
}
