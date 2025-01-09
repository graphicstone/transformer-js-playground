import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import SentimentAnalysis from './pages/models/SentimentAnalysis';
import TextGeneration from './pages/models/TextGeneration';
import FaceParsing from './pages/models/FaceParsing';
import SegmentationAnything from './pages/models/SegmentAnything';
import RemoveBackground from './pages/models/RemoveBackground';
import SmartEraser from './pages/models/SmartEraser';

function App() {
	return (
		<Router>
			<Layout>
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/models/sentiment" element={<SentimentAnalysis />} />
					<Route path="/models/text-generation" element={<TextGeneration />} />
					<Route path="/models/face-parsing" element={<FaceParsing />} />
					<Route path="/models/segmentation-anything" element={<SegmentationAnything />} />
					<Route path="/models/remove-background" element={<RemoveBackground />} />
					<Route path="/models/smart-eraser" element={<SmartEraser />} />
				</Routes>
			</Layout>
		</Router>
	);
}

export default App;
