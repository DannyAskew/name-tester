# Baby Name Tester

A simple app for cycling through baby name combinations and seeing how they look alongside the rest of the family. Add, remove, and browse first, middle, and last names to find the perfect fit.


## Features

- **Setup wizard** — enter your family members on first visit to get started
- Cycle through first, middle, and last name candidates with chevron buttons or click to pick from a dropdown
- Manage your own lists of first, middle, and last names
- Edit family members anytime from the manage panel
- **Share** — generates a URL that anyone can open to instantly load your family and name lists
- Names are saved in `localStorage` so they persist between sessions
- Displays the full family together so you can see how everything looks

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)

### Install

```sh
npm install
```

### Development

```sh
npm run dev
```

Opens at [http://localhost:5173](http://localhost:5173).

### Build for Production

```sh
npm run build
```

Output is written to the `dist/` directory. You can preview the production build with:

```sh
npm run preview
```

## Tech Stack

- Vanilla JS
- [Vite](https://vitejs.dev/)
