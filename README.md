# Gallery Backend

A simple Express.js backend for a user photo gallery with authentication, image uploads, and a paginated feed.

## Features

- User registration and login (username, password, bio)
- JWT authentication
- Upload images with captions (images stored in `/uploads`)
- Edit and delete your own photos
- Paginated feed of all photos
- Get user profile and photos by user
- SQLite database

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Start the server:
   ```
   npm run dev
   ```

3. The server runs on [http://localhost:8080](http://localhost:8080)

## API

See `gallery.postman_collection.json` for API documentation and examples.
Import above mentioned file in postman. [Learn More](https://learning.postman.com/docs/getting-started/importing-and-exporting/importing-and-exporting-overview/)

## Notes

- Images are stored in the `uploads/` directory.
- The SQLite database file is `gallery.db`.