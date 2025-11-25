const mongoose = require('mongoose');
const User = require('../models/user');
const Post = require('../models/post');
const Community = require('../models/community');
require('dotenv').config();

async function seedPosts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Get existing users and communities
    const users = await User.find({});
    const communities = await Community.find({});

    if (users.length === 0) {
      console.log('No users found. Please create users first.');
      return;
    }

    const sampleTitles = [
      'Exploring the Future of AI',
      'Best Practices for Web Development',
      'Understanding Machine Learning',
      'The Art of Clean Code',
      'Blockchain Technology Explained',
      'Mobile App Development Trends',
      'Data Science Fundamentals',
      'Cybersecurity Best Practices',
      'Cloud Computing Solutions',
      'DevOps Culture and Tools'
    ];

    const sampleContents = [
      'This post discusses the latest advancements in artificial intelligence and their potential impact on various industries.',
      'Learn about modern web development techniques and frameworks that are shaping the future of the web.',
      'A comprehensive guide to machine learning algorithms and their practical applications.',
      'Writing maintainable and readable code is crucial for long-term project success.',
      'Understanding blockchain technology and its applications beyond cryptocurrencies.',
      'Stay updated with the latest trends in mobile application development.',
      'Master the fundamentals of data science and analytics.',
      'Protect your applications and data with these essential cybersecurity practices.',
      'Explore different cloud computing platforms and their benefits.',
      'Implementing DevOps practices can significantly improve development workflows.'
    ];

    const tags = [
      ['AI', 'technology', 'future'],
      ['web', 'development', 'javascript'],
      ['ML', 'AI', 'data'],
      ['coding', 'best-practices', 'software'],
      ['blockchain', 'crypto', 'technology'],
      ['mobile', 'apps', 'development'],
      ['data-science', 'analytics', 'python'],
      ['security', 'cybersecurity', 'protection'],
      ['cloud', 'AWS', 'computing'],
      ['devops', 'CI/CD', 'automation']
    ];

    const topics = [
      ['artificial-intelligence', 'innovation'],
      ['web-development', 'programming'],
      ['machine-learning', 'data-science'],
      ['software-engineering', 'best-practices'],
      ['blockchain', 'cryptocurrency'],
      ['mobile-development', 'app-development'],
      ['data-analysis', 'statistics'],
      ['information-security', 'privacy'],
      ['cloud-computing', 'infrastructure'],
      ['software-deployment', 'automation']
    ];

    console.log('Creating 100 sample posts...');

    for (let i = 0; i < 100; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomCommunity = communities.length > 0 ? communities[Math.floor(Math.random() * communities.length)] : null;
      const contentIndex = Math.floor(Math.random() * sampleContents.length);

      const post = new Post({
        title: `${sampleTitles[contentIndex]} - Post ${i + 1}`,
        content: {
          text: sampleContents[contentIndex],
          images: [],
          links: []
        },
        author: randomUser._id,
        community: randomCommunity ? randomCommunity._id : undefined,
        tags: tags[contentIndex],
        // topics: topics[contentIndex], // Commented out due to index issue
        tagSource: 'manual',
        status: 'active',
        spamStatus: 'not_spam',
        spamConfidence: 0,
        spamReason: ''
      });

      await post.save();

      // Add to community if exists
      if (randomCommunity) {
        randomCommunity.posts.push(post._id);
        randomCommunity.postCount = randomCommunity.posts.length;
        await randomCommunity.save();
      }

      if ((i + 1) % 10 === 0) {
        console.log(`Created ${i + 1} posts...`);
      }
    }

    console.log('✅ Successfully created 100 sample posts!');
  } catch (error) {
    console.error('Error seeding posts:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedPosts();