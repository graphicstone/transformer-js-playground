import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AutoProcessor, env, RawImage, SamModel, Tensor } from '@xenova/transformers';
import { IconButton, Slider, Typography } from '@mui/material';
import { BrushIcon, UndoIcon } from 'lucide-react';
import { Button } from '../../components/ui/button.jsx';

const SmartEraser = () => {
	const [isDrawing, setIsDrawing] = useState(false);
	const [brushSize, setBrushSize] = useState(20);
	const [isLoading, setIsLoading] = useState(true);
	const [status, setStatus] = useState('Loading model...');
	const [originalImage, setOriginalImage] = useState(null);
	const [maskHistory, setMaskHistory] = useState([]);

	const canvasRef = useRef(null);
	const drawingCanvasRef = useRef(null);
	const modelRef = useRef(null);
	const processorRef = useRef(null);
	const lastPos = useRef(null);

	// Load SAM model
	useEffect(() => {
		const loadModel = async () => {
			try {
				if (!navigator.gpu) {
					throw new Error('WebGPU is not supported in this browser.');
				}
				const model_id = 'Xenova/slimsam-77-uniform';
				env.allowLocalModels = false;
				env.useBrowserCache = false;
				env.backends.onnx.wasm.proxy = true;

				modelRef.current = await SamModel.from_pretrained(model_id, {
					device: 'webgpu',
					config: { model_type: 'custom' },
				});
				processorRef.current = await AutoProcessor.from_pretrained(model_id);
				setStatus('Model loaded. Ready to erase objects.');
				setIsLoading(false);
			} catch (err) {
				console.error('Error loading model:', err);
				setStatus(`Error: ${err.message}`);
			}
		};
		loadModel();
	}, []);

	// Handle file selection
	const handleImageUpload = (event) => {
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				const img = new Image();
				img.onload = () => {
					setOriginalImage(img);
					initializeCanvas(img);
				};
				img.src = e.target.result;
			};
			reader.readAsDataURL(file);
		}
	};

	// Initialize canvas with image
	const initializeCanvas = useCallback((img) => {
		const canvas = canvasRef.current;
		const drawingCanvas = drawingCanvasRef.current;
		if (!canvas || !drawingCanvas) return;

		const ctx = canvas.getContext('2d');
		const drawingCtx = drawingCanvas.getContext('2d');

		// Set canvas dimensions to match image
		canvas.width = img.width;
		canvas.height = img.height;
		drawingCanvas.width = img.width;
		drawingCanvas.height = img.height;

		// Draw image on main canvas
		ctx.drawImage(img, 0, 0);

		// Clear drawing canvas
		drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
	}, []);

	// Drawing functions
	const startDrawing = useCallback(
		(e) => {
			setIsDrawing(true);
			const pos = getCanvasPoint(e);
			lastPos.current = pos;

			const drawPoint = (position) => {
				const ctx = drawingCanvasRef.current.getContext('2d');
				ctx.beginPath();
				ctx.arc(position.x, position.y, brushSize / 2, 0, Math.PI * 2);
				ctx.fillStyle = '#ff0000';
				ctx.fill();
			};

			drawPoint(pos);
		},
		[brushSize],
	);

	const stopDrawing = useCallback(() => {
		setIsDrawing(false);
		lastPos.current = null;
	}, []);

	const draw = useCallback(
		(e) => {
			if (!isDrawing) return;
			const pos = getCanvasPoint(e);
			const ctx = drawingCanvasRef.current.getContext('2d');

			ctx.beginPath();
			ctx.moveTo(lastPos.current.x, lastPos.current.y);
			ctx.lineTo(pos.x, pos.y);
			ctx.strokeStyle = '#ff0000';
			ctx.lineWidth = brushSize;
			ctx.lineCap = 'round';
			ctx.stroke();

			lastPos.current = pos;
		},
		[isDrawing, brushSize],
	);

	const getCanvasPoint = (e) => {
		const canvas = drawingCanvasRef.current;
		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;

		return {
			x: (e.clientX - rect.left) * scaleX,
			y: (e.clientY - rect.top) * scaleY,
		};
	};

	// Process the marked area
	const processMarkedArea = async () => {
		if (!originalImage) return;

		setStatus('Processing...');

		try {
			const drawingCanvas = drawingCanvasRef.current;
			const mainCanvas = canvasRef.current;

			// Get marked points from drawing canvas
			const ctx = drawingCanvas.getContext('2d');
			const imageData = ctx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height);
			const points = [];

			// Sample points from the drawn mask
			for (let i = 0; i < imageData.data.length; i += 4) {
				if (imageData.data[i] > 0) {
					// Red channel
					const x = (i / 4) % drawingCanvas.width;
					const y = Math.floor(i / 4 / drawingCanvas.width);
					// Store actual pixel coordinates
					points.push([x, y]);
				}
			}

			if (points.length === 0) {
				setStatus('Please mark an area first');
				return;
			}

			// Take center point of the marked area
			const centerX = points.reduce((sum, p) => sum + p[0], 0) / points.length;
			const centerY = points.reduce((sum, p) => sum + p[1], 0) / points.length;

			// Process image with SAM
			const img = await RawImage.fromURL(mainCanvas.toDataURL());
			const imageProcessed = await processorRef.current(img);
			const embeddings = await modelRef.current.get_image_embeddings(imageProcessed);

			// Create input tensors using actual pixel coordinates
			const inputPoint = new Tensor('float32', [centerX, centerY], [1, 1, 2]);

			const inputLabel = new Tensor('int32', [1], [1, 1]);

			// Get prediction from model
			const { pred_masks } = await modelRef.current({
				...embeddings,
				input_points: inputPoint,
				input_labels: inputLabel,
			});

			// Process masks
			const masks = await processorRef.current.post_process_masks(
				pred_masks,
				imageProcessed.original_sizes,
				imageProcessed.reshaped_input_sizes,
			);

			// Apply the mask to remove the object
			const mainCtx = mainCanvas.getContext('2d');
			const imageData2 = mainCtx.getImageData(0, 0, mainCanvas.width, mainCanvas.height);

			// Save current state to history
			setMaskHistory((prev) => [...prev, mainCanvas.toDataURL()]);

			// Apply inpainting with expanded radius for better results
			const maskData = masks[0][0].data;
			const width = mainCanvas.width;
			const height = mainCanvas.height;

			for (let i = 0; i < maskData.length; ++i) {
				if (maskData[i] > 0.5) {
					const x = i % width;
					const y = Math.floor(i / width);

					// Expand the sampling radius for better inpainting
					if (x > 2 && x < width - 3 && y > 2 && y < height - 3) {
						for (let c = 0; c < 3; c++) {
							const idx = i * 4 + c;
							// Sample from a larger neighborhood
							imageData2.data[idx] =
								(imageData2.data[idx - 8] + // further left
									imageData2.data[idx - 4] + // left
									imageData2.data[idx + 4] + // right
									imageData2.data[idx + 8] + // further right
									imageData2.data[idx - width * 8] + // further top
									imageData2.data[idx - width * 4] + // top
									imageData2.data[idx + width * 4] + // bottom
									imageData2.data[idx + width * 8]) / // further bottom
								8;
						}
					}
				}
			}

			mainCtx.putImageData(imageData2, 0, 0);
			ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);

			setStatus('Processing complete. Mark another area to erase.');
		} catch (error) {
			console.error('Error processing marked area:', error);
			setStatus('Error processing marked area. Please try again.');
		}
	};

	const undoLastAction = () => {
		if (maskHistory.length > 0) {
			const lastState = maskHistory[maskHistory.length - 1];
			const img = new Image();
			img.onload = () => {
				const ctx = canvasRef.current.getContext('2d');
				ctx.drawImage(img, 0, 0);
			};
			img.src = lastState;
			setMaskHistory((prev) => prev.slice(0, -1));
		}
	};

	return (
		<div className="min-h-screen bg-gray-100 p-8">
			<div className="max-w-4xl mx-auto">
				<h1 className="text-4xl font-bold mb-4 text-center">Smart Eraser Tool</h1>

				<div className="mb-4 flex justify-center gap-4">
					<input
						type="file"
						accept="image/*"
						onChange={handleImageUpload}
						className="hidden"
						id="image-upload"
					/>
					<label
						htmlFor="image-upload"
						className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-600"
					>
						Upload Image
					</label>

					<Button
						onClick={processMarkedArea}
						disabled={!originalImage || isLoading}
						variant="contained"
						color="primary"
					>
						Remove Marked Area
					</Button>

					<IconButton onClick={undoLastAction} disabled={maskHistory.length === 0}>
						<UndoIcon />
					</IconButton>
				</div>

				<div className="mb-4 flex items-center gap-4">
					<BrushIcon />
					<Slider
						value={brushSize}
						onChange={(_, value) => setBrushSize(value)}
						min={5}
						max={50}
						valueLabelDisplay="auto"
						style={{ width: '200px' }}
					/>
				</div>

				<Typography variant="body2" className="mb-4">
					{status}
				</Typography>

				<div className="relative inline-block">
					<canvas
						ref={canvasRef}
						className="border border-gray-300 rounded-lg"
						style={{ maxWidth: '100%' }}
					/>
					<canvas
						ref={drawingCanvasRef}
						className="absolute top-0 left-0 pointer-events-auto"
						style={{ maxWidth: '100%' }}
						onMouseDown={startDrawing}
						onMouseUp={stopDrawing}
						onMouseOut={stopDrawing}
						onMouseMove={draw}
					/>
				</div>
			</div>
		</div>
	);
};

export default SmartEraser;
