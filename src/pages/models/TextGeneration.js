import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Slider,
} from '@mui/material';
import { pipeline } from '@xenova/transformers';

function TextGeneration() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [maxLength, setMaxLength] = useState(50);

  const runInference = async () => {
    try {
      setLoading(true);
      const generator = await pipeline('text-generation');
      const result = await generator(input, {
        max_length: maxLength,
        num_return_sequences: 1,
      });
      setResult(result);
    } catch (error) {
      console.error('Inference error:', error);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Text Generation
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        This model generates human-like text based on the input prompt. It can be used for creative
        writing, content generation, and completing partial text.
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Enter your prompt"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          sx={{ mb: 2 }}
          placeholder="Example: Once upon a time in a distant galaxy..."
        />

        <Typography gutterBottom>Maximum Length: {maxLength}</Typography>
        <Slider
          value={maxLength}
          onChange={(_, newValue) => setMaxLength(newValue)}
          min={10}
          max={100}
          sx={{ mb: 2 }}
        />

        <Button variant="contained" onClick={runInference} disabled={loading || !input} fullWidth>
          {loading ? <CircularProgress size={24} /> : 'Generate Text'}
        </Button>
      </Paper>

      {result && !result.error && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Generated Text:
          </Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {result[0].generated_text}
          </Typography>
        </Paper>
      )}

      {result?.error && <Alert severity="error">Error: {result.error}</Alert>}
    </Box>
  );
}

export default TextGeneration;
