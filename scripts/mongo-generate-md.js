const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const gray = require('gray-matter');
const dateFormate = require('date-fns');

// 配置文件路径 (匹配图片中您的目录结构)
const POSTS_DIR = path.join(__dirname, '../content/posts');

// MongoDB连接和查询
async function generatePosts() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db(process.env.MONGODB_DB); // 替换为实际数据库名
    const collection = database.collection(process.env.MONGODB_COLLECTION); // 替换为实际集合名

    // 查询需要生成文章的数据
    const cursor = collection.find({ status: 1 }); // 按需修改查询条件 0 草稿 1 发布

    const posts = await cursor.toArray();

    // 确保目录存在
    if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true });

    // 遍历生成.md文件
    for (const post of posts) {
      const fileName = `${post._id}.md`;
      const filePath = path.join(POSTS_DIR, fileName);

      // 构建Front Matter和内容
      const frontMatter = gray.stringify(
        post.content || `
Bing 必应壁纸 ${dateFormate.format(post.created_at, 'yyyy年MM月dd日')}

${post.summary}

### 原图

**图片分辨率：** ${post.pxl}

**图片大小：** ${(post.byte / 1024 / 1024).toFixed(2)}MB

![](${post.origin})
        `, 
        {
          title: post.title,
          date: new Date(post.created_at).toISOString(),
          tags: post.tags?.split(',') || [],
          draft: false,
          featured_image: post.thumb,
          summary: post.summary
        }
      );

      fs.writeFileSync(filePath, frontMatter);
    }
    console.log(`成功生成 ${posts.length} 篇文章`);
    
  } finally {
    await client.close();
  }
}

generatePosts().catch(console.error);