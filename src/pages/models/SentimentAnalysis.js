import { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, CircularProgress, Alert } from '@mui/material';
import { pipeline } from '@xenova/transformers';

function SentimentAnalysis() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runInference = async () => {
    try {
      setLoading(true);
      const classifier = await pipeline('sentiment-analysis');
      const result = await classifier(input);
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
        Sentiment Analysis
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        This model analyzes the emotional tone of text, determining whether its positive, negative,
        or neutral. Its useful for understanding customer feedback, social media monitoring, and
        more.
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Enter text for sentiment analysis"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          sx={{ mb: 2 }}
          placeholder="Example: I really enjoyed this movie, it was fantastic!"
        />

        <Button variant="contained" onClick={runInference} disabled={loading || !input} fullWidth>
          {loading ? <CircularProgress size={24} /> : 'Analyze Sentiment'}
        </Button>
      </Paper>

      {result && !result.error && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Results:
          </Typography>
          {result.map((item, index) => (
            <Alert
              key={index}
              severity={item.label.toLowerCase().includes('positive') ? 'success' : 'info'}
              sx={{ mb: 1 }}
            >
              {item.label}: {(item.score * 100).toFixed(2)}% confidence
            </Alert>
          ))}
        </Paper>
      )}

      {result?.error && <Alert severity="error">Error: {result.error}</Alert>}
    </Box>
  );
}

export default SentimentAnalysis;
