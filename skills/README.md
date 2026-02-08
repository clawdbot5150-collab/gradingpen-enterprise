# OpenClaw Skills Collection

A comprehensive set of 11 productivity and automation skills for OpenClaw (formerly Clawdbot).

## 📦 What's Included

### Productivity & Organization
1. **task-prioritizer** - Intelligently prioritize tasks using the Eisenhower Matrix
2. **meeting-notes-formatter** - Transform messy meeting notes into structured, actionable summaries

### Content Creation
3. **social-media-optimizer** - Adapt content for optimal performance across Twitter, LinkedIn, Instagram, Facebook, TikTok, YouTube
4. **blog-post-expander** - Turn bullet points into fully-developed, SEO-optimized blog posts
5. **video-script-generator** - Create engaging video scripts with scene descriptions, timestamps, and B-roll suggestions

### Developer Tools
6. **code-reviewer** - Comprehensive code reviews checking for bugs, security, performance, and best practices
7. **api-doc-generator** - Create beautiful API documentation from code
8. **test-case-generator** - Automatically generate comprehensive test cases

### Research & Analysis
9. **web-research-summarizer** - Conduct deep research and create well-cited summaries
10. **competitor-analysis** - Analyze competitors' products, pricing, and strategies
11. **trend-analyzer** - Track and analyze industry trends to predict future developments

## 🚀 Installation

### Method 1: Install Individual Skills

1. Copy the `.skill` file you want to your OpenClaw workspace
2. OpenClaw will automatically load the skill on next startup

### Method 2: Install All Skills

```bash
# Copy all .skill files to your OpenClaw skills directory
cp *.skill ~/.openclaw/workspace/skills/
```

### Method 3: Manual Installation

1. Extract the `.skill` file (it's just a zip file):
   ```bash
   unzip task-prioritizer.skill -d ~/.openclaw/workspace/skills/task-prioritizer/
   ```

2. Restart OpenClaw or reload skills

## 📖 Usage

Once installed, these skills activate automatically when you ask OpenClaw relevant questions:

**Examples:**

- "Prioritize my tasks" → Uses **task-prioritizer**
- "Review this code" → Uses **code-reviewer**
- "Turn these bullets into a blog post" → Uses **blog-post-expander**
- "Optimize this for social media" → Uses **social-media-optimizer**
- "Write a video script for YouTube" → Uses **video-script-generator**
- "Format my meeting notes" → Uses **meeting-notes-formatter**
- "Research the latest AI trends" → Uses **web-research-summarizer** or **trend-analyzer**
- "Analyze our competitors" → Uses **competitor-analysis**
- "Generate tests for this code" → Uses **test-case-generator**
- "Document this API" → Uses **api-doc-generator**

## ⚡ Performance Impact

**These skills are lightweight:**
- Only skill metadata (~100 words each) loads into memory by default
- Full skill content only loads when you actually use it
- No background processes or continuous monitoring
- No performance impact on your VPS or computer

**You can safely install all 11 skills without any slowdown.**

## 🔧 Requirements

- OpenClaw (formerly Clawdbot) installed
- Internet connection (for skills that use web search)
- No additional dependencies

## 📝 Skill Details

### task-prioritizer
- Uses Eisenhower Matrix framework
- Scores tasks by urgency, importance, impact, and effort
- Provides time-blocking suggestions
- Identifies quick wins and dependencies

### meeting-notes-formatter
- Converts messy notes into structured summaries
- Extracts action items with owners and deadlines
- Highlights key decisions
- Creates scannable format

### social-media-optimizer
- Platform-specific optimization (Twitter, LinkedIn, Instagram, Facebook, TikTok, YouTube)
- Character limits and best practices for each platform
- Hashtag strategy
- CTA recommendations

### blog-post-expander
- Transforms outlines into full articles
- SEO optimization
- Multiple title options
- Proper structure with intro, body, conclusion

### video-script-generator
- Production-ready scripts with timestamps
- Visual directions (A-roll, B-roll, graphics)
- Platform-specific formats (YouTube, TikTok, Reels)
- Retention optimization

### code-reviewer
- Checks for bugs, security vulnerabilities, performance issues
- Language-agnostic (supports Python, JavaScript, Java, C++, Go, Rust, etc.)
- Provides specific fixes with code examples
- Prioritizes issues by severity

### api-doc-generator
- Creates comprehensive API documentation
- Request/response examples
- Authentication details
- Error codes and handling
- Code samples in multiple languages

### test-case-generator
- Generates unit, integration, and edge case tests
- Supports Jest, Pytest, JUnit, Go testing
- Arrange-Act-Assert pattern
- Mocking examples

### web-research-summarizer
- Multi-source research with citations
- Evaluates source credibility
- Synthesizes findings
- Actionable insights

### competitor-analysis
- SWOT analysis
- Feature and pricing comparisons
- Market positioning
- Strategic recommendations

### trend-analyzer
- Identifies emerging, growing, and declining trends
- Market size and growth projections
- Expert sentiment analysis
- Strategic implications

## 🛠️ Customization

Each skill can be customized by editing the `SKILL.md` file:

1. Extract the .skill file
2. Edit `SKILL.md` to adjust behavior
3. Re-zip the folder with `.skill` extension

## 🐛 Troubleshooting

**Skill not activating:**
- Check that the .skill file is in the correct directory
- Restart OpenClaw
- Try explicitly mentioning the skill in your prompt

**Performance issues:**
- These skills are designed to be lightweight
- If you experience issues, start with just 3-5 skills
- Remove unused skills

**Conflicts with existing skills:**
- Skill descriptions determine when they activate
- If conflicts occur, rename or modify the description field

## 📄 License

These skills are provided as-is for use with OpenClaw.

## 🤝 Contributing

To improve these skills:
1. Extract the .skill file
2. Make your improvements
3. Test thoroughly
4. Re-package and share

## 📧 Support

For issues or questions about these skills, refer to OpenClaw documentation or community forums.

---

**Created:** February 2026
**Version:** 1.0
**Total Skills:** 11
