import React, { useEffect, useRef, useState } from 'react';
import '../../App.css';

const SegmentationAnything = () => {
	const workerRef = useRef(null);
	const [status, setStatus] = useState('Loading...');
	const [imageData, setImageData] = useState(null);
	const [maskData, setMaskData] = useState(null);
	const [lastPoints, setLastPoints] = useState(null);
	const [isEncoded, setIsEncoded] = useState(false);
	const [isDecoding, setIsDecoding] = useState(false);
	const [modelReady, setModelReady] = useState(false);
	const [isMultiMaskMode, setIsMultiMaskMode] = useState(false);

	const maskCanvasRef = useRef(null);
	const imageContainerRef = useRef(null);

	useEffect(() => {
		const worker = new Worker(new URL('../../worker.js', import.meta.url), []);
		workerRef.current = worker;

		worker.onmessage = (e) => {
			const { type, data } = e.data;
			switch (type) {
				case 'ready':
					setModelReady(true);
					setStatus('Ready');
					break;
				case 'segment_result':
					setStatus('Embedding extracted!');
					setIsEncoded(true);
					break;
				case 'decode_result':
					handleDecodeResult(data);
					break;
				default:
					break;
			}
		};

		return () => {
			worker.terminate();
		};
	}, []);

	const handleDecodeResult = ({ mask, scores }) => {
		setIsDecoding(false);
		const canvas = maskCanvasRef.current;
		const context = canvas.getContext('2d');
		const imageData = context.createImageData(mask.width, mask.height);

		const bestIndex = scores.indexOf(Math.max(...scores));
		setStatus(`Segment score: ${scores[bestIndex].toFixed(2)}`);

		for (let i = 0; i < mask.data.length; i++) {
			const offset = i * 4;
			const isSelected = mask.data[i * scores.length + bestIndex];
			imageData.data[offset] = isSelected ? 0 : 255;
			imageData.data[offset + 1] = isSelected ? 114 : 255;
			imageData.data[offset + 2] = isSelected ? 189 : 255;
			imageData.data[offset + 3] = isSelected ? 255 : 0;
		}
		context.putImageData(imageData, 0, 0);
	};

	const segmentImage = (data) => {
		setImageData(data);
		setIsEncoded(false);
		setStatus('Extracting image embedding...');
		workerRef.current.postMessage({ type: 'segment', data });
	};

	const handleFileUpload = (e) => {
		const file = e.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => segmentImage(event.target.result);
		reader.readAsDataURL(file);
	};

	const handleExampleClick = () => {
		segmentImage(
			'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/corgi.jpg',
		);
	};

	const handleMouseClick = (e) => {
		if (!isEncoded) return;

		const bb = imageContainerRef.current.getBoundingClientRect();
		const x = (e.clientX - bb.left) / bb.width;
		const y = (e.clientY - bb.top) / bb.height;

		const label = e.button === 2 ? 0 : 1;
		const point = { point: [x, y], label };

		setLastPoints((prev) => (prev ? [...prev, point] : [point]));
		setIsMultiMaskMode(true);
		workerRef.current.postMessage({ type: 'decode', data: [point] });
	};

	const handleReset = () => {
		setImageData(null);
		setIsEncoded(false);
		setMaskData(null);
		workerRef.current.postMessage({ type: 'reset' });
	};

	const handleClearPoints = () => {
		setLastPoints(null);
		const canvas = maskCanvasRef.current;
		const context = canvas.getContext('2d');
		context.clearRect(0, 0, canvas.width, canvas.height);
	};

	return (
		<div className="App">
			<h1>Segment Anything with 🤗 Transformers.js</h1>
			<div id="container" ref={imageContainerRef} onMouseDown={handleMouseClick}>
				<label id="upload-button">
					<input type="file" id="upload" accept="image/*" onChange={handleFileUpload} />
					Click to upload image or <span onClick={handleExampleClick}>try example</span>
				</label>
				<canvas id="mask-output" ref={maskCanvasRef}></canvas>
			</div>
			<label id="status">{status}</label>
			<div id="controls">
				<button onClick={handleReset}>Reset Image</button>
				<button onClick={handleClearPoints}>Clear Points</button>
			</div>
			<p>Left-click = Positive points, Right-click = Negative points</p>
		</div>
	);
};

export default SegmentationAnything;
