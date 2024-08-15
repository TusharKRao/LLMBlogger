const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { generateBlogContent } = require('./llmService.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/blog', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});



// Blog Post Schema
const blogPostSchema = new mongoose.Schema({
    title: String,
    content: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Blog Post Model
const BlogPost = mongoose.model('BlogPost', blogPostSchema);

// POST /api/generate - Accepts a prompt and returns generated blog content
app.post('/api/generate', async (req, res) => {
    const { prompt } = req.body;
    console.log(req.body);

    try {
        // Call the LLM service to generate content
        const generatedContent = await generateBlogContent(prompt);
        console.log('generated content')
        console.log(generatedContent)
        const newPost = new BlogPost({
            title: `Blog Post for: ${prompt}`,
            content: generatedContent,
        });

        const savedPost = await newPost.save();
        res.status(201).json(savedPost);
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Error creating blog post', error });
    }
});


// GET /api/posts - Retrieves all blog posts from the database
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await BlogPost.find();
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving blog posts', error });
    }
});

// DELETE /api/posts/:id - Deletes a specific blog post by ID
app.delete('/api/posts/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deletedPost = await BlogPost.findByIdAndDelete(id);
        if (!deletedPost) {
            return res.status(404).json({ message: 'Blog post not found' });
        }
        res.status(200).json({ message: 'Blog post deleted', deletedPost });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting blog post', error });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
