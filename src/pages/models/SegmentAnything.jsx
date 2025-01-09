import React, { useEffect, useRef, useState } from 'react';
import { AutoProcessor, env, RawImage, SamModel, Tensor } from '@xenova/transformers';

env.allowLocalModels = false;

const EXAMPLE_URL =
	'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/corgi.jpg';

const SegmentAnything = () => {
	const [status, setStatus] = useState('Loading model...');
	const [imageDataURI, setImageDataURI] = useState(null);
	const [isEncoded, setIsEncoded] = useState(false);
	const [isDecoding, setIsDecoding] = useState(false);
	const [isMultiMaskMode, setIsMultiMaskMode] = useState(false);
	const [modelReady, setModelReady] = useState(false);
	const [points, setPoints] = useState(null);

	const containerRef = useRef(null);
	const canvasRef = useRef(null);
	const fileInputRef = useRef(null);
	const modelRef = useRef(null);
	const processorRef = useRef(null);
	const imageEmbeddingsRef = useRef(null);
	const imageInputsRef = useRef(null);

	useEffect(() => {
		const initModel = async () => {
			try {
				const [model, processor] = await Promise.all([
					SamModel.from_pretrained('Xenova/slimsam-77-uniform', { quantized: true }),
					AutoProcessor.from_pretrained('Xenova/slimsam-77-uniform'),
				]);

				modelRef.current = model;
				processorRef.current = processor;
				setModelReady(true);
				setStatus('Ready');
			} catch (error) {
				setStatus('Error loading model');
				console.error(error);
			}
		};

		initModel();
	}, []);

	const handleFileUpload = async (e) => {
		console.log('File upload triggered');
		const file = e.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			const dataURI = e.target.result;
			handleSegment(dataURI);
		};
		reader.readAsDataURL(file);
	};

	const handleClickUpload = () => {
		console.log('Click upload triggered');
		fileInputRef.current?.click();
	};

	const handleExample = async (e) => {
		console.log('Example clicked');
		e.preventDefault();
		e.stopPropagation();
		handleSegment(EXAMPLE_URL);
	};

	const handleSegment = async (dataURI) => {
		console.log('Segmenting image');
		setIsEncoded(false);
		setImageDataURI(dataURI);
		setStatus('Extracting image embedding...');

		try {
			const image = await RawImage.read(dataURI);
			const inputs = await processorRef.current(image);
			imageInputsRef.current = inputs;
			imageEmbeddingsRef.current = await modelRef.current.get_image_embeddings(inputs);

			setIsEncoded(true);
			setStatus('Embedding extracted!');
		} catch (error) {
			setStatus('Error processing image');
			console.error(error);
		}
	};

	const handleDecode = async () => {
		if (!points || isDecoding || !isEncoded) return;

		setIsDecoding(true);
		const reshaped = imageInputsRef.current.reshaped_input_sizes[0];

		const pointCoords = points.map((x) => [x.point[0] * reshaped[1], x.point[1] * reshaped[0]]);

		const labels = points.map((x) => BigInt(x.label));

		const input_points = new Tensor('float32', pointCoords.flat(Infinity), [
			1,
			1,
			pointCoords.length,
			2,
		]);

		const input_labels = new Tensor('int64', labels.flat(Infinity), [1, 1, labels.length]);

		try {
			const outputs = await modelRef.current({
				...imageEmbeddingsRef.current,
				input_points,
				input_labels,
			});

			const masks = await processorRef.current.post_process_masks(
				outputs.pred_masks,
				imageInputsRef.current.original_sizes,
				imageInputsRef.current.reshaped_input_sizes,
			);

			drawMask(RawImage.fromTensor(masks[0][0]), outputs.iou_scores.data);
		} catch (error) {
			console.error('Decode error:', error);
		} finally {
			setIsDecoding(false);
		}
	};

	const drawMask = (mask, scores) => {
		const canvas = canvasRef.current;
		const context = canvas.getContext('2d');

		canvas.width = mask.width;
		canvas.height = mask.height;

		const imageData = context.createImageData(canvas.width, canvas.height);
		const numMasks = scores.length;
		let bestIndex = scores.indexOf(Math.max(...scores));

		setStatus(`Segment score: ${scores[bestIndex].toFixed(2)}`);

		const pixelData = imageData.data;
		for (let i = 0; i < pixelData.length / 4; ++i) {
			if (mask.data[numMasks * i + bestIndex] === 1) {
				const offset = 4 * i;
				pixelData[offset] = 0; // red
				pixelData[offset + 1] = 114; // green
				pixelData[offset + 2] = 189; // blue
				pixelData[offset + 3] = 255; // alpha
			}
		}

		context.putImageData(imageData, 0, 0);
	};

	const handleMouseDown = (e) => {
		if (e.button !== 0 && e.button !== 2) return;
		if (!isEncoded) return;

		e.preventDefault();

		if (!isMultiMaskMode) {
			setIsMultiMaskMode(true);
		}

		const point = getPoint(e);
		setPoints((prev) => [...(prev || []), point]);
	};

	const getPoint = (e) => {
		const bb = containerRef.current.getBoundingClientRect();
		const mouseX = Math.max(0, Math.min((e.clientX - bb.left) / bb.width, 1));
		const mouseY = Math.max(0, Math.min((e.clientY - bb.top) / bb.height, 1));

		return {
			point: [mouseX, mouseY],
			label: e.button === 2 ? 0 : 1,
		};
	};

	const handleMouseMove = (e) => {
		if (!isEncoded || isMultiMaskMode || isDecoding) return;

		const point = getPoint(e);
		setPoints([point]);
	};

	const clearPointsAndMask = () => {
		console.log('Clearing points and mask');
		setIsMultiMaskMode(false);
		setPoints(null);
		const context = canvasRef.current.getContext('2d');
		context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
	};

	const handleReset = () => {
		setIsEncoded(false);
		setImageDataURI(null);
		imageInputsRef.current = null;
		imageEmbeddingsRef.current = null;
		clearPointsAndMask();
		setStatus('Ready');
	};

	useEffect(() => {
		if (points) {
			handleDecode();
		}
	}, [handleDecode, points]);

	const handleCutMask = async () => {
		const canvas = canvasRef.current;
		const [w, h] = [canvas.width, canvas.height];

		const maskContext = canvas.getContext('2d');
		const maskPixelData = maskContext.getImageData(0, 0, w, h);

		const image = new Image();
		image.crossOrigin = 'anonymous';
		image.onload = async () => {
			const imageCanvas = document.createElement('canvas');
			imageCanvas.width = w;
			imageCanvas.height = h;
			const imageContext = imageCanvas.getContext('2d');
			imageContext.drawImage(image, 0, 0, w, h);
			const imagePixelData = imageContext.getImageData(0, 0, w, h);

			const cutCanvas = document.createElement('canvas');
			cutCanvas.width = w;
			cutCanvas.height = h;
			const cutContext = cutCanvas.getContext('2d');
			const cutPixelData = cutContext.getImageData(0, 0, w, h);

			for (let i = 3; i < maskPixelData.data.length; i += 4) {
				if (maskPixelData.data[i] > 0) {
					for (let j = 0; j < 4; ++j) {
						const offset = i - j;
						cutPixelData.data[offset] = imagePixelData.data[offset];
					}
				}
			}
			cutContext.putImageData(cutPixelData, 0, 0);

			const link = document.createElement('a');
			link.download = 'cut-image.png';
			link.href = cutCanvas.toDataURL();
			link.click();
		};
		image.src = imageDataURI;
	};

	return (
		<div className="flex flex-col items-center p-8">
			<h1 className="text-2xl mb-4">Segment Anything w/ 🤗 Transformers.js</h1>

			<div
				ref={containerRef}
				className="relative w-[640px] h-[420px] max-w-full max-h-full border-2 border-dashed border-gray-300 rounded-xl overflow-hidden cursor-pointer mt-4"
				style={{
					backgroundImage: imageDataURI ? `url(${imageDataURI})` : 'none',
					backgroundSize: '100% 100%',
					backgroundPosition: 'center',
					backgroundRepeat: 'no-repeat',
				}}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onContextMenu={(e) => e.preventDefault()}
			>
				<canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" />

				{!imageDataURI && (
					<div className="absolute inset-0 flex flex-col items-center justify-center z-10">
						<button
							onClick={handleClickUpload}
							className="flex flex-col items-center focus:outline-none hover:opacity-80"
						>
							<svg width="25" height="25" viewBox="0 0 25 25" fill="none">
								<path
									fill="#000"
									d="M3.5 24.3a3 3 0 0 1-1.9-.8c-.5-.5-.8-1.2-.8-1.9V2.9c0-.7.3-1.3.8-1.9.6-.5 1.2-.7 2-.7h18.6c.7 0 1.3.2 1.9.7.5.6.7 1.2.7 2v18.6c0 .7-.2 1.4-.7 1.9a3 3 0 0 1-2 .8H3.6Zm0-2.7h18.7V2.9H3.5v18.7Zm2.7-2.7h13.3c.3 0 .5 0 .6-.3v-.7l-3.7-5a.6.6 0 0 0-.6-.2c-.2 0-.4 0-.5.3l-3.5 4.6-2.4-3.3a.6.6 0 0 0-.6-.3c-.2 0-.4.1-.5.3l-2.7 3.6c-.1.2-.2.4 0 .7.1.2.3.3.6.3Z"
								/>
							</svg>
							<span className="mt-2">Click to upload image</span>
						</button>
						<button
							onClick={handleExample}
							className="text-sm text-blue-600 underline mt-1 focus:outline-none hover:opacity-80"
						>
							(or try example)
						</button>
					</div>
				)}

				{points?.map((point, i) => (
					<div
						key={i}
						className="absolute w-4 h-4 transform -translate-x-1/2 -translate-y-1/2 z-20"
						style={{
							left: `${point.point[0] * 100}%`,
							top: `${point.point[1] * 100}%`,
							backgroundImage: `url(${point.label === 1 ? '/star-icon.png' : '/cross-icon.png'})`,
							backgroundSize: 'contain',
						}}
					/>
				))}
			</div>

			<div className="text-sm min-h-[16px] my-2">{status}</div>

			<div className="space-x-2">
				<button
					onClick={handleReset}
					className="px-3 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:text-gray-600"
				>
					Reset image
				</button>
				<button
					onClick={clearPointsAndMask}
					className="px-3 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:text-gray-600"
				>
					Clear points
				</button>
				<button
					onClick={handleCutMask}
					disabled={!isEncoded || !points}
					className="px-3 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:text-gray-600"
				>
					Cut mask
				</button>
			</div>

			<p className="mt-1 text-sm">Left click = positive points, right click = negative points.</p>

			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				onChange={handleFileUpload}
				className="hidden"
			/>
		</div>
	);
};

export default SegmentAnything;
