# > ⚠️ **Early Access Disclaimer**
> 
> **vCode IDE is currently in alpha and is not ready for production use.** This is an early access version intended for testing and feedback. Expect frequent updates and potential breaking changes.

# vCode IDE

![vCode Logo](src/imgs/vcode_long.svg)

vCode IDE (short for vibe-code IDE) is a modern, opinionated Integrated Development Environment designed to work seamlessly with Grok as an AI agent. It provides a powerful, user-friendly interface for coding, project management, and AI-assisted development workflows. This IDE is intentionally minimal and focused, offering a distraction-free environment for developers.

## Features
- **AI-Powered Development**: Deep integration with Grok AI agent for intelligent code assistance and suggestions.
- **Built-in Git Support**: Manage your repositories effortlessly with integrated Git tools.
- **Minimalist Design**: Opinionated and distraction-free, with no plugins or custom themes.
- **Fast and Lightweight**: Built with performance in mind, ensuring a smooth development experience.

## Installation

### Prerequisites
- [Bun](https://bun.sh/) (v1.0 or newer required)

### Clone the Repository
```sh
git clone https://github.com/vibe-stack/vcode.git
cd vcode
```

### Install Dependencies
Install dependencies using Bun:
```sh
bun install
```

## Building and Running

### Development Mode
To start the IDE in development mode with hot reloading:
```sh
bun run dev
```

### Production Build
To build the IDE for production:
```sh
bun run build
```

The production build will be output to the `dist/` directory.

## Contributing
We welcome contributions from the community! Feel free to open issues, submit pull requests, or suggest new features. For more details, see our [Contributing Guidelines](CONTRIBUTING.md).

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

For more information, explore the source code and comments. Join us in shaping the future of vCode IDE!
