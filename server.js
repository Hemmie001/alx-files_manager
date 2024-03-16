import express from 'express';
import router from './routes/index';

const port = parseInt(process.env.PORT, 10) || 5000;

const app = express();

app.use(express.json());
app.use('/', router);

app.listen(5000, () => {
  console.log(`Server running on port 5000`);
});

export default app;
