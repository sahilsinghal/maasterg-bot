# Contributing to MAAsterG Bot

Thank you for your interest in contributing! We welcome contributions from everyone.

---

## Code of Conduct

- Be respectful and inclusive
- Focus on the code, not the person
- Help others learn and grow
- Report issues responsibly

---

## How to Contribute

### 1. Fork the Repository

```bash
# Go to GitHub and click "Fork"
```

### 2. Clone Your Fork

```bash
git clone https://github.com/yourusername/maasterg-bot.git
cd maasterg-bot
```

### 3. Create a Branch

```bash
git checkout -b feature/amazing-feature
# or
git checkout -b fix/bug-fix
```

### 4. Make Changes

```bash
# Edit files as needed
# Follow code style guidelines (see below)
```

### 5. Test Your Changes

```bash
# Test locally
npm start

# Send test message
# Verify feature works
```

### 6. Commit Changes

```bash
git add .
git commit -m "Add: amazing feature" 
# or
git commit -m "Fix: bug description"
```

### 7. Push to Your Fork

```bash
git push origin feature/amazing-feature
```

### 8. Create Pull Request

- Go to GitHub repository
- Click "Compare & pull request"
- Add description of your changes
- Submit PR

---

## Code Style Guidelines

### JavaScript/Node.js

```javascript
// Use 2-space indentation
const example = "code";

// Use meaningful variable names
const userMessage = msg.message.conversation;
// NOT: const um = msg.message.conversation;

// Add comments for complex logic
// Generate random response
const response = responses[Math.floor(Math.random() * responses.length)];

// Use const/let, avoid var
const immutable = "value";
let mutable = "value";

// Use arrow functions when appropriate
const double = (x) => x * 2;

// Handle errors properly
try {
  // code
} catch (error) {
  console.error('Error:', error.message);
}
```

### File Naming

```
✅ bot.js
✅ package.json
✅ .gitignore
❌ Bot.js
❌ Bot-Main.js
❌ gitignore
```

### Comments

```javascript
// Use single-line comments for short explanations
const port = process.env.PORT || 3000;

// Use multi-line comments for complex logic
/**
 * Sends a WhatsApp message to user
 * @param {string} sender - Phone number of recipient
 * @param {string} text - Message text to send
 * @returns {Promise} Result of message send
 */
const sendMessage = async (sender, text) => {
  return await sock.sendMessage(sender, { text });
};
```

---

## Types of Contributions

### Bug Fixes

- Create issue first describing the bug
- Reference issue in pull request
- Include test case showing bug is fixed

### New Features

- Discuss feature in issue first
- Keep changes minimal and focused
- Update documentation
- Add comments explaining complex logic

### Documentation

- Fix typos and clarify explanations
- Add examples
- Improve formatting
- Keep language simple

### Tests

- Add tests for new features
- Tests should verify both success and failure cases
- Run tests before submitting PR

---

## Commit Message Guidelines

### Format

```
<type>: <subject>

<body>

<footer>
```

### Type

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding tests

### Examples

```
feat: Add support for Spanish language

fix: Resolve QR code not displaying on Windows

docs: Add setup guide for Oracle Cloud deployment

refactor: Simplify message handling logic

perf: Optimize memory usage in session storage
```

### Guidelines

- Use lowercase
- Start with verb in imperative mood
- Keep subject under 50 characters
- Don't end with period
- Separate subject from body with blank line
- Wrap body at 72 characters

---

## Pull Request Process

### Before Submitting

1. **Test locally:**
   ```bash
   npm start
   # Send test messages
   # Verify all features work
   ```

2. **Check code style:**
   ```bash
   # Manually review your code
   # Check against guidelines above
   ```

3. **Update documentation:**
   ```bash
   # If adding feature, update README
   # If fixing bug, add to TROUBLESHOOTING
   ```

4. **Commit and push:**
   ```bash
   git push origin feature/amazing-feature
   ```

### PR Description

Include:
- What does this PR do?
- Why is it needed?
- How to test it?
- Any breaking changes?
- Screenshots (if UI-related)

### Example PR Description

```markdown
## Description
Adds support for Hindi language in menu system.

## Type of Change
- [ ] Bug fix
- [x] New feature
- [ ] Breaking change
- [ ] Documentation

## Related Issue
Closes #42

## How to Test
1. Run `npm start`
2. Send message
3. Select option "2" for Hindi
4. Verify Hindi menu appears

## Checklist
- [x] Code follows style guidelines
- [x] Self-review completed
- [x] Comments added for complex logic
- [x] Documentation updated
- [x] Tested locally
```

---

## Areas Where Help Needed

### High Priority

- Multi-language improvements
- Error handling enhancements
- Performance optimizations
- Documentation improvements

### Medium Priority

- Database integration examples
- Analytics implementation
- Admin dashboard
- Testing framework

### Low Priority

- UI improvements
- Animation effects
- Theme support

---

## Development Setup

### Install Dev Dependencies

```bash
npm install
```

### Run in Dev Mode

```bash
npm run dev
# or with nodemon (auto-restart on changes):
npm install -g nodemon
nodemon bot.js
```

### Debug Mode

```bash
DEBUG=* npm start
```

---

## Questions?

- 📧 Email: contact@maasterg.org
- 💬 Create a GitHub Issue
- 📖 Read SETUP.md or DEPLOYMENT.md

---

## Recognition

Contributors will be recognized in:
- README.md contributors list
- Release notes
- GitHub contributors page

---

Thank you for contributing! 🙏
