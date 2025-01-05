import { Box, AppBar, Toolbar, Typography, Container } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

function Layout({ children }) {
  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            Transformer.js Playground
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {children}
      </Container>
    </Box>
  );
}

export default Layout;
