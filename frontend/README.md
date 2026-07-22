# Frontend

This is a Vite/React frontend for the portfolio app.

## Run locally

Install dependencies from the frontend directory, then start the dev server:

```sh
npm install
npm run dev
```

To create a production build:

```sh
npm run build
```

## Books demo

Start the dev server and open `/books` in the browser to view the local books demo route. The page renders sample data through the reusable `BookList` component and paginates the visible rows client-side.

## Reusing `BookList`

Import `BookList` and pass an array of book objects with `title`, `author`, `genre`, and `publishedDate` properties. You can also pass `itemsPerPage` to control pagination size.

```jsx
import BookList from './components/BookList'

const books = [
  {
    title: 'Kindred',
    author: 'Octavia E. Butler',
    genre: 'Historical Fiction',
    publishedDate: '1979'
  }
]

<BookList books={books} itemsPerPage={5} />
```
