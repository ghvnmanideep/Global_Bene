const mongoose = require('mongoose');
const Post = require('../models/post');
const User = require('../models/user');
const Community = require('../models/community');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Sample post data
const samplePosts = [
  {
    title: "Getting Started with React Development",
    content: {
      text: "React is a powerful JavaScript library for building user interfaces. Here's a comprehensive guide to get you started with React development.",
      images: [],
      links: [{ url: "https://reactjs.org/docs/getting-started.html", title: "React Documentation", description: "Official React documentation" }]
    },
    tags: ["react", "javascript", "frontend", "web-development"],
    category: "tech"
  },
  {
    title: "The Future of Artificial Intelligence",
    content: {
      text: "AI is transforming industries at an unprecedented pace. From machine learning to neural networks, here's what the future holds.",
      images: [],
      links: []
    },
    tags: ["ai", "machine-learning", "technology", "future"],
    category: "tech"
  },
  {
    title: "Healthy Meal Prep Ideas for Busy Professionals",
    content: {
      text: "Maintaining a healthy diet doesn't have to be time-consuming. Here are some quick and nutritious meal prep ideas.",
      images: [],
      links: [],
    },
    tags: ["health", "nutrition", "meal-prep", "lifestyle"],
    category: "health"
  },
  {
    title: "Understanding Cryptocurrency Investments",
    content: {
      text: "Cryptocurrency has become a major investment opportunity. Learn the basics of crypto investing and risk management.",
      images: [],
      links: [{ url: "https://www.coinbase.com/learn", title: "Coinbase Learn", description: "Educational resources for cryptocurrency" }],
    },
    tags: ["cryptocurrency", "bitcoin", "investment", "finance"],
    category: "other"
  },
  {
    title: "Remote Work Productivity Tips",
    content: {
      text: "Working from home can be challenging. Here are proven strategies to stay productive and maintain work-life balance.",
      images: [],
      links: [],
    },
    tags: ["remote-work", "productivity", "work-life-balance", "career"],
    category: "other"
  },
  {
    title: "Sustainable Living: Small Changes, Big Impact",
    content: {
      text: "Every small action counts when it comes to environmental sustainability. Start with these simple changes today.",
      images: [],
      links: [],
    },
    tags: ["sustainability", "environment", "eco-friendly", "lifestyle"],
    category: "other"
  },
  {
    title: "Python Data Analysis with Pandas",
    content: {
      text: "Pandas is the go-to library for data manipulation in Python. Learn how to analyze and visualize data effectively.",
      images: [],
      links: [{ url: "https://pandas.pydata.org/docs/", title: "Pandas Documentation", description: "Official Pandas documentation" }],
    },
    tags: ["python", "data-analysis", "pandas", "programming"],
    category: "tech"
  },
  {
    title: "Mental Health Awareness in the Workplace",
    content: {
      text: "Creating a supportive work environment for mental health is crucial. Here's how organizations can promote wellbeing.",
      images: [],
      links: [],
    },
    tags: ["mental-health", "workplace", "wellness", "corporate"],
    category: "other"
  },
  {
    title: "Home Gardening for Beginners",
    content: {
      text: "Growing your own vegetables and herbs is rewarding and cost-effective. Start your gardening journey with these tips.",
      images: [],
      links: [],
    },
    tags: ["gardening", "homestead", "sustainability", "hobby"],
    category: "other"
  },
  {
    title: "Cloud Computing Fundamentals",
    content: {
      text: "Understanding cloud computing is essential for modern IT professionals. Learn about AWS, Azure, and GCP basics.",
      images: [],
      links: [],
    },
    tags: ["cloud-computing", "aws", "azure", "it"],
    category: "tech"
  },
  {
    title: "Building Strong Personal Finance Habits",
    content: {
      text: "Financial literacy is key to long-term success. Develop these habits to take control of your finances.",
      images: [],
      links: [],
    },
    tags: ["personal-finance", "budgeting", "saving", "money-management"],
    category: "other"
  },
  {
    title: "The Art of Public Speaking",
    content: {
      text: "Effective communication is a valuable skill. Master the art of public speaking with these techniques.",
      images: [],
      links: [],
    },
    tags: ["public-speaking", "communication", "presentation", "leadership"],
    category: "other"
  },
  {
    title: "Renewable Energy Solutions for Homes",
    content: {
      text: "Solar panels, wind turbines, and other renewable solutions are becoming more accessible. Explore your options.",
      images: [],
      links: [],
    },
    tags: ["renewable-energy", "solar", "sustainability", "green-tech"],
    category: "tech"
  },
  {
    title: "Mindfulness and Meditation Practices",
    content: {
      text: "Incorporating mindfulness into daily life can reduce stress and improve focus. Try these simple meditation techniques.",
      images: [],
      links: [],
    },
    tags: ["mindfulness", "meditation", "mental-health", "wellness"],
    category: "other"
  },
  {
    title: "Mobile App Development Trends 2024",
    content: {
      text: "The mobile app landscape is constantly evolving. Stay ahead with these emerging trends and technologies.",
      images: [],
      links: [],
    },
    tags: ["mobile-development", "app-development", "trends", "technology"],
    category: "tech"
  },
  {
    title: "Investing in Real Estate: A Beginner's Guide",
    content: {
      text: "Real estate can be a solid investment strategy. Learn the fundamentals and get started on the right path.",
      images: [],
      links: [],
    },
    tags: ["real-estate", "investment", "property", "finance"],
    category: "other"
  },
  {
    title: "The Psychology of Decision Making",
    content: {
      text: "Understanding how we make decisions can lead to better choices. Explore cognitive biases and rational thinking.",
      images: [],
      links: [],
    },
    tags: ["psychology", "decision-making", "cognitive-bias", "behavior"],
    category: "other"
  },
  {
    title: "Cybersecurity Best Practices for Individuals",
    content: {
      text: "Protect yourself online with these essential cybersecurity practices and tools.",
      images: [],
      links: [],
    },
    tags: ["cybersecurity", "online-safety", "privacy", "security"],
    category: "tech"
  },
  {
    title: "Creative Writing Techniques",
    content: {
      text: "Unlock your creativity with these writing techniques and exercises. Whether you're writing fiction or non-fiction.",
      images: [],
      links: [],
    },
    tags: ["writing", "creativity", "literature", "creative-writing"],
    category: "other"
  },
  {
    title: "Fitness Routines for Different Age Groups",
    content: {
      text: "Age-appropriate exercise is important for maintaining health. Find the right fitness routine for your age group.",
      images: [],
      links: [],
    },
    tags: ["fitness", "exercise", "health", "age-appropriate"],
    category: "other"
  },
  {
    title: "Entrepreneurship: From Idea to Launch",
    content: {
      text: "Turning an idea into a successful business requires planning and execution. Follow this step-by-step guide.",
      images: [],
      links: [],
    },
    tags: ["entrepreneurship", "startup", "business", "innovation"],
    category: "other"
  },
  {
    title: "Digital Marketing Strategies That Work",
    content: {
      text: "Effective digital marketing can drive growth for any business. Learn proven strategies and tactics.",
      images: [],
      links: [],
    },
    tags: ["digital-marketing", "seo", "social-media", "advertising"],
    category: "other"
  },
  {
    title: "Cooking International Cuisine at Home",
    content: {
      text: "Explore world cuisines from the comfort of your kitchen. Easy recipes and authentic techniques.",
      images: [],
      links: [],
    },
    tags: ["cooking", "international-cuisine", "recipes", "culinary"],
    category: "other"
  },
  {
    title: "Blockchain Technology Beyond Cryptocurrency",
    content: {
      text: "Blockchain has applications far beyond crypto. Discover how this technology is transforming various industries.",
      images: [],
      links: [],
    },
    tags: ["blockchain", "distributed-ledger", "technology", "innovation"],
    category: "tech"
  },
  {
    title: "Parenting in the Digital Age",
    content: {
      text: "Raising children in today's digital world presents unique challenges. Navigate screen time and online safety.",
      images: [],
      links: [],
    },
    tags: ["parenting", "digital-age", "online-safety", "family"],
    category: "other"
  },
  {
    title: "Sustainable Fashion Choices",
    content: {
      text: "Make conscious fashion choices that are good for you and the planet. Ethical brands and eco-friendly materials.",
      images: [],
      links: [],
    },
    tags: ["sustainable-fashion", "eco-friendly", "ethics", "shopping"],
    category: "other"
  },
  {
    title: "Learning Languages Effectively",
    content: {
      text: "Master a new language with proven learning techniques and modern tools. From apps to immersion methods.",
      images: [],
      links: [],
    },
    tags: ["language-learning", "education", "communication", "culture"],
    category: "other"
  },
  {
    title: "Home Office Setup Optimization",
    content: {
      text: "Create the perfect home office environment for maximum productivity and comfort.",
      images: [],
      links: [],
    },
    tags: ["home-office", "productivity", "workspace", "ergonomics"],
    category: "other"
  },
  {
    title: "Understanding Climate Change Science",
    content: {
      text: "The science behind climate change explained clearly. Facts, data, and what individuals can do.",
      images: [],
      links: [],
    },
    tags: ["climate-change", "science", "environment", "sustainability"],
    category: "other"
  },
  {
    title: "Building Emergency Preparedness Kits",
    content: {
      text: "Be prepared for emergencies with a well-stocked preparedness kit. Essential items and planning tips.",
      images: [],
      links: [],
    },
    tags: ["emergency-preparedness", "safety", "disaster-planning", "survival"],
    category: "other"
  },
  {
    title: "The Evolution of Social Media",
    content: {
      text: "From early platforms to today's metaverse, explore how social media has transformed communication.",
      images: [],
      links: [],
    },
    tags: ["social-media", "communication", "technology", "digital-culture"],
    category: "tech"
  },
  {
    title: "Natural Remedies for Common Ailments",
    content: {
      text: "Explore natural alternatives for managing common health issues. Always consult healthcare professionals.",
      images: [],
      links: [],
    },
    tags: ["natural-remedies", "health", "alternative-medicine", "wellness"],
    category: "other"
  },
  {
    title: "Photography Composition Techniques",
    content: {
      text: "Improve your photography skills with these composition techniques and rules of thumb.",
      images: [],
      links: [],
    },
    tags: ["photography", "composition", "visual-arts", "creativity"],
    category: "other"
  },
  {
    title: "Understanding Stock Market Basics",
    content: {
      text: "Demystify the stock market with this beginner's guide to investing in stocks and understanding market dynamics.",
      images: [],
      links: [],
    },
    tags: ["stock-market", "investing", "finance", "market-analysis"],
    category: "other"
  },
  {
    title: "The Science of Sleep and Dreams",
    content: {
      text: "Explore the fascinating world of sleep science and dream interpretation. Improve your sleep quality.",
      images: [],
      links: [],
    },
    tags: ["sleep-science", "dreams", "neuroscience", "health"],
    category: "other"
  },
  {
    title: "DIY Home Improvement Projects",
    content: {
      text: "Tackle home improvement projects yourself with these beginner-friendly guides and safety tips.",
      images: [],
      links: [],
    },
    tags: ["diy", "home-improvement", "crafting", "renovation"],
    category: "other"
  },
  {
    title: "The Psychology of Motivation",
    content: {
      text: "Understanding what drives human behavior can help you achieve your goals. Intrinsic vs extrinsic motivation.",
      images: [],
      links: [],
    },
    tags: ["psychology", "motivation", "behavior", "goal-setting"],
    category: "other"
  },
  {
    title: "Electric Vehicles: Pros and Cons",
    content: {
      text: "Weigh the benefits and drawbacks of electric vehicles. Environmental impact, cost savings, and infrastructure.",
      images: [],
      links: [],
    },
    tags: ["electric-vehicles", "sustainability", "automotive", "green-tech"],
    category: "tech"
  },
  {
    title: "Building a Personal Brand Online",
    content: {
      text: "Establish your professional identity in the digital space. From LinkedIn to personal websites.",
      images: [],
      links: [],
    },
    tags: ["personal-branding", "professional-development", "social-media", "career"],
    category: "other"
  },
  {
    title: "The History of Space Exploration",
    content: {
      text: "From Sputnik to Mars missions, trace the incredible journey of humanity's exploration of space.",
      images: [],
      links: [],
    },
    tags: ["space-exploration", "astronomy", "history", "science"],
    category: "other"
  },
  {
    title: "Mindful Eating for Better Health",
    content: {
      text: "Practice mindful eating to improve digestion, reduce overeating, and enjoy food more fully.",
      images: [],
      links: [],
    },
    tags: ["mindful-eating", "nutrition", "health", "wellness"],
    category: "other"
  },
  {
    title: "Introduction to Quantum Computing",
    content: {
      text: "Dive into the world of quantum computing. Understand qubits, superposition, and potential applications.",
      images: [],
      links: [],
    },
    tags: ["quantum-computing", "physics", "technology", "innovation"],
    category: "tech"
  },
  {
    title: "Conflict Resolution in Relationships",
    content: {
      text: "Learn effective communication and conflict resolution strategies for healthier relationships.",
      images: [],
      links: [],
    },
    tags: ["relationships", "communication", "conflict-resolution", "emotional-intelligence"],
    category: "other"
  },
  {
    title: "The Rise of Remote Work Culture",
    content: {
      text: "How remote work is reshaping company culture, productivity metrics, and employee satisfaction.",
      images: [],
      links: [],
    },
    tags: ["remote-work", "company-culture", "workforce", "future-of-work"],
    category: "other"
  },
  {
    title: "Urban Gardening and Vertical Farming",
    content: {
      text: "Grow food in limited spaces with urban gardening techniques and vertical farming innovations.",
      images: [],
      links: [],
    },
    tags: ["urban-gardening", "vertical-farming", "sustainability", "food-security"],
    category: "other"
  },
  {
    title: "The Ethics of Artificial Intelligence",
    content: {
      text: "Explore the ethical considerations surrounding AI development and deployment in society.",
      images: [],
      links: [],
    },
    tags: ["ai-ethics", "artificial-intelligence", "technology-ethics", "society"],
    category: "tech"
  },
  {
    title: "Financial Planning for Retirement",
    content: {
      text: "Start planning for retirement early. Investment strategies, savings plans, and lifestyle considerations.",
      images: [],
      links: [],
    },
    tags: ["retirement-planning", "financial-planning", "investment", "long-term"],
    category: "other"
  },
  {
    title: "The Impact of Social Media on Society",
    content: {
      text: "Analyze how social media platforms influence behavior, politics, and mental health.",
      images: [],
      links: [],
    },
    tags: ["social-media", "society", "psychology", "digital-culture"],
    category: "other"
  },
  {
    title: "Traditional Crafts and Cultural Preservation",
    content: {
      text: "Learn about traditional crafts from around the world and efforts to preserve cultural heritage.",
      images: [],
      links: [],
    },
    tags: ["traditional-crafts", "cultural-preservation", "heritage", "artisanship"],
    category: "other"
  },
  {
    title: "The Science of Happiness",
    content: {
      text: "Research-backed insights into what makes people happy and how to cultivate happiness in daily life.",
      images: [],
      links: [],
    },
    tags: ["happiness", "positive-psychology", "wellness", "science"],
    category: "other"
  }
];

// Function to get random element from array
const getRandomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

// Function to get random subset of array
const getRandomSubset = (array, maxCount) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.floor(Math.random() * maxCount) + 1);
};

const seedPosts = async () => {
  try {
    console.log('Starting post seeding...');

    // Get all existing users
    const users = await User.find({}).select('_id username');
    if (users.length === 0) {
      console.log('No users found. Please create users first.');
      return;
    }

    console.log(`Found ${users.length} users`);

    // Get existing communities (if any)
    let communities = await Community.find({}).select('_id name');

    // Create a default community if none exist
    if (communities.length === 0) {
      console.log('No communities found. Creating a default community...');
      const defaultCommunity = new Community({
        name: 'General',
        displayName: 'General Discussion',
        description: 'General discussion community',
        creator: users[0]._id, // Use first user as creator
        isPrivate: false,
        tags: ['general'],
        memberCount: users.length,
        members: users.map(u => u._id)
      });
      await defaultCommunity.save();
      communities = [defaultCommunity];
      console.log('Default community created');
    }

    // Check how many posts already exist
    const existingPostsCount = await Post.countDocuments();
    console.log(`Found ${existingPostsCount} existing posts`);

    if (existingPostsCount >= 100) {
      console.log('Already have 100 or more posts. Skipping seeding.');
      return;
    }

    const postsToCreate = 100 - existingPostsCount;
    console.log(`Creating ${postsToCreate} new posts...`);

    const posts = [];

    for (let i = 0; i < postsToCreate; i++) {
      const samplePost = getRandomElement(samplePosts);
      const randomUser = getRandomElement(users);

      // Always assign a random community
      let communityId = getRandomElement(communities)._id;

      // Create post with new structure
      const post = new Post({
        title: samplePost.title,
        content: samplePost.content,
        author: randomUser._id,
        community: communityId,
        tags: samplePost.tags,
        tagSource: 'manual',
        category: samplePost.category,
        status: 'active',
        spamStatus: 'not_spam',
        spamConfidence: 0,
        spamReason: '',
        // Add some random engagement data
        viewCount: Math.floor(Math.random() * 100) + 1,
        commentCount: Math.floor(Math.random() * 10),
        saveCount: Math.floor(Math.random() * 20),
        // Random creation date within last 30 days
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      });

      posts.push(post);
    }

    // Insert all posts
    const insertedPosts = await Post.insertMany(posts);
    console.log(`Successfully created ${insertedPosts.length} posts`);

    // Update community post counts if communities were assigned
    for (const post of insertedPosts) {
      if (post.community) {
        await Community.findByIdAndUpdate(post.community, {
          $inc: { postCount: 1 },
          $push: { posts: post._id }
        });
      }
    }

    console.log('Post seeding completed successfully!');

  } catch (error) {
    console.error('Error seeding posts:', error);
  }
};

// Run the seeding
const updateExistingPosts = async () => {
  console.log('Updating existing posts to valid categories...');
  const invalidCategories = ['technology', 'finance', 'career', 'science', 'business', 'education', 'lifestyle'];
  const categoryMap = {
    'technology': 'tech',
    'finance': 'other',
    'career': 'other',
    'science': 'other',
    'business': 'other',
    'education': 'other',
    'lifestyle': 'other'
  };

  for (const [invalid, valid] of Object.entries(categoryMap)) {
    await Post.updateMany({ category: invalid }, { category: valid });
  }
  console.log('Updated existing posts');
};

const runSeeding = async () => {
  await connectDB();
  await updateExistingPosts();
  await seedPosts();
  console.log('Seeding process completed');
  process.exit(0);
};

runSeeding();
