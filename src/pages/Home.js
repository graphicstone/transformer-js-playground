import { Link as RouterLink } from 'react-router-dom';
import { ArrowRight, Brain, Image, MessageSquare, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';

const modelCategories = [
	{
		title: 'Text Classification',
		icon: <MessageSquare className="w-6 h-6" />,
		description: 'Analyze and classify text with state-of-the-art models',
		bgColor: 'bg-blue-50',
		iconColor: 'text-blue-500',
		models: [
			{
				id: 'sentiment',
				name: 'Sentiment Analysis',
				path: '/models/sentiment',
				description: 'Analyze the emotional tone of text',
				gradient: 'from-blue-500 to-cyan-500',
			},
		],
	},
	{
		title: 'Text Generation',
		icon: <Brain className="w-6 h-6" />,
		description: 'Generate human-like text for various applications',
		bgColor: 'bg-purple-50',
		iconColor: 'text-purple-500',
		models: [
			{
				id: 'text-generation',
				name: 'Text Generation',
				path: '/models/text-generation',
				description: 'Generate human-like text from prompts',
				gradient: 'from-purple-500 to-pink-500',
			},
		],
	},
	{
		title: 'Image Segmentation',
		icon: <Image className="w-6 h-6" />,
		description: 'Advanced image processing and segmentation tools',
		bgColor: 'bg-green-50',
		iconColor: 'text-green-500',
		models: [
			{
				id: 'face-parsing',
				name: 'Face Parsing',
				path: '/models/face-parsing',
				description: 'Parse facial features from images',
				gradient: 'from-green-500 to-emerald-500',
			},
			{
				id: 'segmentation-anything',
				name: 'Segment Anything',
				path: '/models/segmentation-anything',
				description: 'Segment anything from images',
				gradient: 'from-orange-500 to-red-500',
			},
			{
				id: 'remove-background',
				name: 'Remove Background',
				path: '/models/remove-background',
				description: 'Remove background from images',
				gradient: 'from-yellow-500 to-orange-500',
			},
			{
				id: 'smart-eraser',
				name: 'Smart Eraser',
				path: '/models/smart-eraser',
				description: 'Erase background from images',
				gradient: 'from-yellow-500 to-orange-500',
			},
		],
	},
];

function ModelCard({ model }) {
	return (
		<RouterLink to={model.path} className="block group/card">
			<div
				className={`p-4 rounded-xl bg-gradient-to-r ${model.gradient} hover:scale-[1.02] transition-all duration-200`}
			>
				<div className="flex justify-between items-center">
					<div>
						<h3 className="font-medium text-white">{model.name}</h3>
						<p className="text-white/80 text-sm">{model.description}</p>
					</div>
					<ArrowRight className="w-5 h-5 text-white opacity-0 group-hover/card:opacity-100 transition-opacity" />
				</div>
			</div>
		</RouterLink>
	);
}

function CategoryCard({ category }) {
	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-4">
					<div className={`p-3 rounded-xl ${category.bgColor} ${category.iconColor}`}>
						{category.icon}
					</div>
					<CardTitle>{category.title}</CardTitle>
				</div>
				<CardDescription>{category.description}</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{category.models.map((model) => (
						<ModelCard key={model.id} model={model} />
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function Home() {
	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
			{/* Hero Section */}
			<div className="relative overflow-hidden">
				<div className="absolute inset-0">
					<div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 opacity-50" />
				</div>
				<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pb-32">
					<div className="text-center">
						<div className="flex items-center justify-center mb-6 space-x-2">
							<Sparkles className="w-8 h-8 text-purple-500" />
							<Badge variant="purple">Browser-based ML</Badge>
						</div>
						<h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-6">
							Transformer.js{' '}
							<span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
								Playground
							</span>
						</h1>
						<p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
							Experience the power of machine learning directly in your browser. No server required.
							Built with Transformer.js for lightning-fast, client-side AI operations.
						</p>
						<div className="mt-10 flex items-center justify-center gap-x-6">
							<Button variant="gradient" size="lg" asChild>
								<a
									href="https://huggingface.co/docs/transformers.js"
									target="_blank"
									rel="noopener noreferrer"
								>
									Documentation
								</a>
							</Button>
							<Button variant="ghost" size="lg" asChild>
								<a
									href="https://github.com/xenova/transformers.js"
									target="_blank"
									rel="noopener noreferrer"
								>
									View on GitHub <ArrowRight className="ml-2 h-4 w-4" />
								</a>
							</Button>
						</div>
					</div>
				</div>
			</div>

			{/* Features Grid */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Explore Our Models</h2>
				<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
					{modelCategories.map((category) => (
						<CategoryCard key={category.title} category={category} />
					))}
				</div>
			</div>

			{/* Footer Section */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
				<p className="text-gray-500">
					Powered by{' '}
					<Button variant="link" asChild>
						<a
							href="https://huggingface.co/docs/transformers.js"
							target="_blank"
							rel="noopener noreferrer"
						>
							Transformer.js
						</a>
					</Button>
				</p>
			</div>
		</div>
	);
}

export default Home;
