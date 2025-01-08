import React, { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { pipeline } from '@xenova/transformers';
import ErrorBoundary from '../../components/ErrorBoundary'; // Adjust the path as necessary

function FaceParsing() {
	const [model, setModel] = useState(null);
	const [output, setOutput] = useState(null);

	useEffect(() => {
		const loadModel = async () => {
			try {
				// env.allowLocalModels = false; // Ensure models are loaded from the Hugging Face hub
				// const loadedModel = await pipeline('image-segmentation', 'jonathandinu/face-parsing');
				const segmenter = await pipeline('image-segmentation', 'Xenova/face-parsing');
				const url =
					'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/portrait-of-woman.jpg';
				const output = await segmenter(url);
				console.log('output', output);
				setModel(output);
			} catch (error) {
				console.error('Error loading model:', error);
			}
		};

		loadModel();
	}, []);

	const handleImageUpload = async (event) => {
		const file = event.target.files[0];
		if (file && model) {
			const url = URL.createObjectURL(file);
			try {
				const result = await model(url); // Pass the URL directly
				setOutput(result);
			} catch (error) {
				console.error('Error processing image:', error);
			}
		}
	};

	return (
		<ErrorBoundary>
			<Box sx={{ textAlign: 'center', mt: 4 }}>
				<Typography variant="h4" gutterBottom>
					Face Parsing
				</Typography>
				<Typography variant="body1" sx={{ mb: 2 }}>
					Upload an image to see the face parsing results.
				</Typography>
				<input
					accept="image/*"
					style={{ display: 'none' }}
					id="upload-button"
					type="file"
					onChange={handleImageUpload}
				/>
				<label htmlFor="upload-button">
					<Button variant="contained" component="span">
						Upload Image
					</Button>
				</label>
				{output && (
					<Box sx={{ mt: 4 }}>
						{output.map((mask, index) => (
							<Typography key={index} variant="body2">
								Found: {mask.label}
							</Typography>
						))}
					</Box>
				)}
			</Box>
		</ErrorBoundary>
	);
}

export default FaceParsing;
