import { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, CircularProgress } from '@mui/material';
import { useParams } from 'react-router-dom';
import { pipeline } from '@xenova/transformers';

function ModelPage() {
	const { modelId } = useParams();
	const [input, setInput] = useState('');
	const [result, setResult] = useState('');
	const [loading, setLoading] = useState(false);

	const runInference = async () => {
		try {
			setLoading(true);
			let result;

			switch (modelId) {
				case 'sentiment':
					const classifier = await pipeline('sentiment-analysis');
					result = await classifier(input);
					break;
				case 'toxicity':
					// Implement toxicity detection
					break;
				case 'text-generation':
					const generator = await pipeline('text-generation');
					result = await generator(input);
					break;
				// Add more cases for different models
				default:
					throw new Error('Model not implemented');
			}

			setResult(JSON.stringify(result, null, 2));
		} catch (error) {
			console.error('Inference error:', error);
			setResult('Error running inference: ' + error.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Box>
			<Typography variant="h4" gutterBottom>
				{modelId
					.split('-')
					.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
					.join(' ')}
			</Typography>

			<Paper sx={{ p: 3, mb: 3 }}>
				<TextField
					fullWidth
					multiline
					rows={4}
					label="Enter text for analysis"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					sx={{ mb: 2 }}
				/>

				<Button variant="contained" onClick={runInference} disabled={loading || !input} fullWidth>
					{loading ? <CircularProgress size={24} /> : 'Run Model'}
				</Button>
			</Paper>

			{result && (
				<Paper sx={{ p: 3 }}>
					<Typography variant="h6" gutterBottom>
						Results:
					</Typography>
					<pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{result}</pre>
				</Paper>
			)}
		</Box>
	);
}

export default ModelPage;
