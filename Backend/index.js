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
    key: Number,
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
        kk = generatedContent.length % 3;
        const newPost = new BlogPost({
            title: `Blog Post for: ${prompt}`,
            key: kk,
            content: generatedContent,
        });

        const savedPost = await newPost.save();
        res.status(201).json(savedPost);
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Error creating blog post', error });
    }
});


// GET /api/posts - Gets all posts from the database, or if key specified, only posts having that key value, and displays the most recent one
app.get('/api/posts', async (req, res) => {
    const { key } = req.query;
    console.log("key=" + key);
    try {
        let posts;
        if (key) {
            // If a key is provided, filter by the key and give the latest entry
            posts = await BlogPost.findOne({ key: key }).sort({ createdAt: -1 });
        } else
        //provide only latest entries for each key in the database
        {
            posts = await BlogPost.aggregate([
                    {
                        $sort: { key: 1, createdAt: -1 } // Sort by key and then by createdAt descending
                    },
                    {
                        $group: {
                            _id: "$key",                // Group by key
                            post: { $first: "$$ROOT" }  // Take the most recent post in each group
                        }
                    },
                    {
                        $replaceRoot: { newRoot: "$post" } // Replace root with the most recent post
                    }
                ]);
        }

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
