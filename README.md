# Allure Report Storage 📊

A powerful REST API service for managing and storing Allure test reports. This project provides a centralized storage solution for your Allure test results, making it easier to manage and access test reports across different projects and test runs.

## Features ✨

- Store and manage Allure test reports 📝
- Project-based organization 📁
- Multiple test run support 🔄
- RESTful API endpoints 🚀
- Swagger UI documentation 📚
- Built with TypeScript for type safety 💪

## Prerequisites 🛠️

- Node.js (Latest LTS version recommended)
- npm or yarn package manager

## Installation 📥

1. Clone the repository:
```bash
git clone https://github.com/yourusername/allure-report-storage.git
cd allure-report-storage
```

2. Install dependencies:
```bash
npm install
```

## Development 🚀

To start the development server with hot-reload:

```bash
npm run dev
```

## Building 🏗️

To build the project:

```bash
npm run build
```

## Project Structure 🗂️

```
src/
├── routes/      # API route handlers
├── services/    # Business logic services
├── types/       # TypeScript type definitions
└── index.ts     # Application entry point
```

## API Documentation 📖

The API documentation is available through Swagger UI when the server is running. Access it at:
```
http://localhost:3000/swagger
```

## Dependencies 📦

- Hono - Fast and type-safe web framework
- @hono/node-server - Node.js adapter for Hono
- @hono/swagger-ui - Swagger UI integration
- @hono/zod-openapi - OpenAPI integration with Zod
- allure-commandline - Allure report generation

## License 📄

[Add your license information here]

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

```
npm install
npm run dev
```

```
open http://localhost:3000
```
