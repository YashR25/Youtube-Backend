# Backend README

This README provides an overview of the backend for the React Native project. It includes information on how to set up and run the backend, as well as details on the available endpoints and functionalities.

## Setup

1. Clone the repository for the backend.
2. Install the required dependencies using `npm install`.
3. Create a `.env` file in the root directory and configure the necessary environment variables.
4. Start the server using `npm run dev`.

## Endpoints

The backend provides the following endpoints:

- `/api/v1/user`: Handles user-related operations such as registration, login, and profile updates.
- `/api/v1/video`: Manages video-related operations including uploading, fetching, and deleting videos.
- `/api/v1/comment`: Handles comment-related operations such as adding, updating, and deleting comments.
- `/api/v1/like`: Manages like-related operations including liking and unliking videos and comments.
- `/api/v1/playlist`: Handles playlist-related operations such as creating, updating, and deleting playlists.
- `/api/v1/subscription`: Manages subscription-related operations including subscribing and unsubscribing to channels.
- `/api/v1/dashboard`: Provides statistics and analytics related to the application's usage and performance.

## Dependencies

The backend utilizes the following dependencies:

- Express: A fast and minimalist web application framework for Node.js.
- Mongoose: An Object Data Modeling (ODM) library for MongoDB and Node.js.
- Bcrypt: A library for hashing and salting passwords.
- JWT: A library for generating and verifying JSON Web Tokens.
- Multer: A middleware for handling file uploads.
- Cloudinary: A cloud-based image and video management platform.
- Socket.io: A library for real-time, bidirectional communication between the server and clients.

## Contributing

Contributions to the backend are welcome! If you encounter any issues or have suggestions for improvements, please feel free to open an issue or submit a pull request.

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).
