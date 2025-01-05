import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import SentimentAnalysis from './pages/models/SentimentAnalysis';
import TextGeneration from './pages/models/TextGeneration';
import FaceParsing from './pages/models/FaceParsing';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/models/sentiment" element={<SentimentAnalysis />} />
          <Route path="/models/text-generation" element={<TextGeneration />} />
          <Route path="/models/face-parsing" element={<FaceParsing />} />
          {/* Add more model routes as they're implemented */}
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
