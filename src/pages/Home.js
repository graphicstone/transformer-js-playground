import { Typography, Card, CardContent, CardActionArea, Box, Divider } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Link as RouterLink } from 'react-router-dom';

const modelCategories = [
  {
    title: 'Text Classification',
    models: [
      {
        id: 'sentiment',
        name: 'Sentiment Analysis',
        path: '/models/sentiment',
        description: 'Analyze the emotional tone of text',
      },
    ],
  },
  {
    title: 'Text Generation',
    models: [
      {
        id: 'text-generation',
        name: 'Text Generation',
        path: '/models/text-generation',
        description: 'Generate human-like text from prompts',
      },
    ],
  },
  {
    title: 'Image Segmentation',
    models: [
      {
        id: 'face-parsing',
        name: 'Face Parsing',
        path: '/models/face-parsing',
        description: 'Parse facial features from images',
      },
    ],
  },
  // Add more categories as needed
];

function Home() {
  return (
    <Box>
      {/* Introduction Section */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h3" gutterBottom>
          Welcome to Transformer.js Playground
        </Typography>
        <Typography variant="h6">
          Explore the power of Transformer models running directly in your browser
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Transformer.js allows you to run state-of-the-art machine learning models directly in your
          browser, with no server required. This playground demonstrates various capabilities of the
          library using different models and tasks.
        </Typography>
      </Box>

      <Divider sx={{ mb: 6 }} />

      {/* Models Section */}
      <Typography variant="h4" gutterBottom>
        Available Models
      </Typography>

      {modelCategories.map((category) => (
        <Box key={category.title} sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            {category.title}
          </Typography>
          <Grid container spacing={3}>
            {category.models.map((model) => (
              <Grid item xs={12} sm={6} md={4} key={model.id}>
                <Card>
                  <CardActionArea component={RouterLink} to={model.path}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {model.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {model.description}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
    </Box>
  );
}

export default Home;
