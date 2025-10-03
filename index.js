const express = require('express');
const cors = require('cors');           // ✅ Add this
const app = express();
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protected');
const eventRoutes = require('./routes/events');

app.use(cors());                        // ✅ Add this
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes);
app.use('/api/events', eventRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
