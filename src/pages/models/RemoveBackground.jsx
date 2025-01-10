import { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { AutoModel, AutoProcessor, env, RawImage } from '@xenova/transformers';
import { Copy, Download, ExternalLink, Trash2, Upload, X } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

export default function RemoveBackground() {
	const [images, setImages] = useState([]);
	const [processedImages, setProcessedImages] = useState([]);
	const [isProcessing, setIsProcessing] = useState(false);
	const [isDownloadReady, setIsDownloadReady] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);

	const modelRef = useRef(null);
	const processorRef = useRef(null);

	useEffect(() => {
		(async () => {
			try {
				if (!navigator.gpu) {
					throw new Error('WebGPU is not supported in this browser.');
				}
				const model_id = 'briaai/RMBG-1.4';
				env.allowLocalModels = false;
				env.useBrowserCache = false;
				env.backends.onnx.wasm.proxy = true;
				modelRef.current ??= await AutoModel.from_pretrained(model_id, {
					device: 'webgpu',
					config: { model_type: 'custom' },
				});
				processorRef.current ??= await AutoProcessor.from_pretrained(model_id, {
					// Do not require config.json to be present in the repository
					config: {
						do_normalize: true,
						do_pad: false,
						do_rescale: true,
						do_resize: true,
						image_mean: [0.5, 0.5, 0.5],
						feature_extractor_type: 'ImageFeatureExtractor',
						image_std: [1, 1, 1],
						resample: 2,
						rescale_factor: 0.00392156862745098,
						size: { width: 1024, height: 1024 },
					},
				});
			} catch (err) {
				console.log('Error loading model:', err);
				setError(err);
			}
			setIsLoading(false);
		})();
	}, []);

	const onDrop = useCallback((acceptedFiles) => {
		setImages((prevImages) => [
			...prevImages,
			...acceptedFiles.map((file) => URL.createObjectURL(file)),
		]);
	}, []);

	const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
		onDrop,
		accept: {
			'image/*': ['.jpeg', '.jpg', '.png'],
		},
	});

	const removeImage = (index) => {
		setImages((prevImages) => prevImages.filter((_, i) => i !== index));
		setProcessedImages((prevProcessed) => prevProcessed.filter((_, i) => i !== index));
	};

	const processImages = async () => {
		setIsProcessing(true);
		setProcessedImages([]);

		const model = modelRef.current;
		const processor = processorRef.current;

		for (let i = 0; i < images.length; ++i) {
			// Load image
			const img = await RawImage.fromURL(images[i]);

			// Pre-process image
			const { pixel_values } = await processor(img);

			// Predict alpha matte
			const { output } = await model({ input: pixel_values });

			const maskData = (
				await RawImage.fromTensor(output[0].mul(255).to('uint8')).resize(img.width, img.height)
			).data;

			// Create new canvas
			const canvas = document.createElement('canvas');
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext('2d');

			// Draw original image output to canvas
			ctx.drawImage(img.toCanvas(), 0, 0);

			// Update alpha channel
			const pixelData = ctx.getImageData(0, 0, img.width, img.height);
			for (let i = 0; i < maskData.length; ++i) {
				pixelData.data[4 * i + 3] = maskData[i];
			}
			ctx.putImageData(pixelData, 0, 0);
			setProcessedImages((prevProcessed) => [...prevProcessed, canvas.toDataURL('image/png')]);
		}

		setIsProcessing(false);
		setIsDownloadReady(true);
	};

	const downloadAsZip = async () => {
		const zip = new JSZip();
		const promises = images.map(
			(image, i) =>
				new Promise((resolve) => {
					const canvas = document.createElement('canvas');
					const ctx = canvas.getContext('2d');

					const img = new Image();
					img.src = processedImages[i] || image;

					img.onload = () => {
						canvas.width = img.width;
						canvas.height = img.height;
						ctx.drawImage(img, 0, 0);
						canvas.toBlob((blob) => {
							if (blob) {
								zip.file(`image-${i + 1}.png`, blob);
							}
							resolve(null);
						}, 'image/png');
					};
				}),
		);

		await Promise.all(promises);

		const content = await zip.generateAsync({ type: 'blob' });
		saveAs(content, 'images.zip');
	};

	const clearAll = () => {
		setImages([]);
		setProcessedImages([]);
		setIsDownloadReady(false);
	};

	const copyToClipboard = async (url) => {
		try {
			// Fetch the image from the URL and convert it to a Blob
			const response = await fetch(url);
			const blob = await response.blob();

			// Create a clipboard item with the image blob
			const clipboardItem = new ClipboardItem({ [blob.type]: blob });

			// Write the clipboard item to the clipboard
			await navigator.clipboard.write([clipboardItem]);

			console.log('Image copied to clipboard');
		} catch (err) {
			console.error('Failed to copy image: ', err);
		}
	};

	const downloadImage = (url) => {
		const link = document.createElement('a');
		link.href = url;
		link.download = 'image.png';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	if (error) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-8">
				<div className="text-center">
					<Badge variant="destructive" className="mb-4">
						Error
					</Badge>
					<h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">
						Something went wrong
					</h2>
					<p className="text-gray-600 max-w-[500px] mx-auto">{error.message}</p>
				</div>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-8">
				<div className="text-center">
					<div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600 mb-4" />
					<p className="text-gray-600 font-medium">Loading background removal model...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
			<div className="max-w-5xl mx-auto">
				{/* Hero Section */}
				<div className="text-center mb-12">
					<Badge variant="purple" className="mb-4">
						Background Removal
					</Badge>
					<h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
						Remove Background
						<span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
							{' '}
							WebGPU
						</span>
					</h1>
					<p className="text-gray-600 max-w-2xl mx-auto">
						In-browser background removal, powered by{' '}
						<a
							className="text-purple-600 hover:text-purple-700 font-medium"
							target="_blank"
							href="https://github.com/xenova/transformers.js"
							rel="noreferrer"
						>
							🤗 Transformers.js
						</a>
					</p>

					<div className="flex justify-center gap-4 mt-6">
						{[
							{
								href: 'https://github.com/huggingface/transformers.js-examples/blob/main/LICENSE',
								text: 'License (Apache 2.0)',
							},
							{
								href: 'https://huggingface.co/Xenova/modnet',
								text: 'Model (MODNet)',
							},
							{
								href: 'https://github.com/huggingface/transformers.js-examples/tree/main/remove-background-webgpu/',
								text: 'Code (GitHub)',
							},
						].map(({ href, text }) => (
							<Button key={text} variant="ghost" size="sm" asChild>
								<a href={href} target="_blank" rel="noreferrer">
									{text} <ExternalLink className="ml-2 h-4 w-4" />
								</a>
							</Button>
						))}
					</div>
				</div>

				{/* Dropzone */}
				<div
					{...getRootProps()}
					className={`p-12 mb-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all duration-300 ease-in-out bg-white
            ${isDragAccept ? 'border-green-500 bg-green-50' : ''}
            ${isDragReject ? 'border-red-500 bg-red-50' : ''}
            ${isDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-500 hover:bg-purple-50'}
          `}
				>
					<input {...getInputProps()} className="hidden" />
					<Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
					<p className="text-lg font-medium text-gray-900 mb-2">
						{isDragActive ? 'Drop the images here...' : 'Drag and drop images here'}
					</p>
					<p className="text-sm text-gray-500">or click to select files</p>
				</div>

				{/* Action Buttons */}
				<div className="flex flex-col items-center gap-4 mb-12">
					<Button
						onClick={processImages}
						disabled={isProcessing || images.length === 0}
						size="lg"
						variant={isProcessing ? 'outline' : 'default'}
						className="w-48"
					>
						{isProcessing ? 'Processing...' : 'Process Images'}
					</Button>

					<div className="flex gap-4">
						<Button onClick={downloadAsZip} disabled={!isDownloadReady} variant="outline" size="sm">
							<Download className="w-4 h-4 mr-2" />
							Download ZIP
						</Button>
						<Button onClick={clearAll} variant="destructive" size="sm">
							<Trash2 className="w-4 h-4 mr-2" />
							Clear All
						</Button>
					</div>
				</div>

				{/* Image Grid */}
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
					{images.map((src, index) => (
						<div
							key={index}
							className="relative group rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-200"
						>
							<img
								src={processedImages[index] || src}
								alt={`${index + 1}`}
								className="object-cover w-full h-48"
							/>
							{processedImages[index] && (
								<div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
									<Button
										onClick={() => copyToClipboard(processedImages[index])}
										variant="secondary"
										size="sm"
									>
										<Copy className="w-4 h-4 mr-2" />
										Copy
									</Button>
									<Button
										onClick={() => downloadImage(processedImages[index])}
										variant="secondary"
										size="sm"
									>
										<Download className="w-4 h-4 mr-2" />
										Save
									</Button>
								</div>
							)}
							<Button
								onClick={() => removeImage(index)}
								variant="ghost"
								size="icon"
								className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
