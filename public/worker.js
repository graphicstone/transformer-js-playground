 
import {
    AutoProcessor,
    env,
    RawImage,
    SamModel,
    Tensor,
} from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.14.0';

// Since we will download the model from the Hugging Face Hub, we can skip the local model check
env.allowLocalModels = false;

// Singleton pattern to enable lazy-loading of the model and processor
class SegmentAnythingSingleton {
	static model_id = 'Xenova/slimsam-77-uniform';

	static model;

	static processor;

	static quantized = true;

	static getInstance() {
		if (!this.model) {
			this.model = SamModel.from_pretrained(this.model_id, {
				quantized: this.quantized,
			});
		}
		if (!this.processor) {
			this.processor = AutoProcessor.from_pretrained(this.model_id);
		}

		return Promise.all([this.model, this.processor]);
	}
}

// State variables
let imageEmbeddings = null;
let imageInputs = null;
let ready = false;

self.onmessage = async (e) => {
	const [model, processor] = await SegmentAnythingSingleton.getInstance();

	if (!ready) {
		// Indicate readiness
		ready = true;
		self.postMessage({ type: 'ready' });
	}

	const { type, data } = e.data;

	if (type === 'reset') {
		imageInputs = null;
		imageEmbeddings = null;

	} else if (type === 'segment') {
		// Start segmenting
		self.postMessage({ type: 'segment_result', data: 'start' });

		const image = await RawImage.read(data);
		imageInputs = await processor(image);
		imageEmbeddings = await model.get_image_embeddings(imageInputs);

		self.postMessage({ type: 'segment_result', data: 'done' });

	} else if (type === 'decode') {
		const reshaped = imageInputs.reshaped_input_sizes[0];
		const points = data.map((x) => [x.point[0] * reshaped[1], x.point[1] * reshaped[0]]);
		const labels = data.map((x) => BigInt(x.label));

		const inputPoints = new Tensor('float32', points.flat(Infinity), [1, 1, points.length, 2]);
		const inputLabels = new Tensor('int64', labels.flat(Infinity), [1, 1, labels.length]);

		const outputs = await model({
			...imageEmbeddings,
			input_points: inputPoints,
			input_labels: inputLabels,
		});

		const masks = await processor.post_process_masks(
			outputs.pred_masks,
			imageInputs.original_sizes,
			imageInputs.reshaped_input_sizes,
		);

		self.postMessage({
			type: 'decode_result',
			data: {
				mask: RawImage.fromTensor(masks[0][0]),
				scores: outputs.iou_scores.data,
			},
		});

	} else {
		throw new Error(`Unknown message type: ${type}`);
	}
};
