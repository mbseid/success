# Success

Welcome to  Success!  This tool is designed specifically for engineering managers to assist with their people and projects, while also incorporating AI capabilities to make you successful.

> :warning: **Alpha Product**: This project is evolving rapidly. 


## Features

- **People Management:** Success provides a set of features to help managers effectively manage their team members. This includes tracking individual progress and recording notes. This is especially helpful with large organizations, n > 30. 
- **Project Management:** With Success, managers can easily oversee and organize projects. They can assign tasks, track progress, and ensure timely completion of deliverables. (still in progress)
- **Link Management:** Success allows managers to save and organize relevant links and resources. This eliminates the need for manual bookmarking and ensures easy accessibility to important information.
- **AI Integration:** Success incorporates AI to enhance decision-making processes. It can do very little. One day it will provide recommendations, analyze data, and generate insights to support managers in making informed decisions.

## Getting Started 

You can easily self host Success. I suggust using Docker compose to run the application. It contains three parts: frontend, backend and database. 

1. Create your [docker-compose.yaml](https://github.com/mbseid/success/blob/main/examples/docker-compose.yaml) based off the example linked. 
2. Update the environment variables with your secrets: `postgres`, `SECRET_KEY`, `OPENAI_API_KEY`, etc.
3. Run Success `docker compose up -d`
4. Run the migrations `docker compose run backend migrate.py migrate`
5. Navigate to `http://localhost:3000` and celebrate! 

## Contributing

We welcome contributions from the community! If you'd like to contribute to the Success project, please follow these guidelines:

1. Fork the repository. 
2. Create a new branch for your contribution.
3. Make your changes and ensure they follow our coding standards.
4. Test your changes thoroughly.
5. Submit a pull request detailing the changes you've made.

## Technology Used

### Backend
The backend of this project is built using Django, a Python web framework. Django provides a robust and scalable foundation for developing web applications, making it easier to handle data, authentication, and other backend functionalities. GraphQL is the API to interact with the backend. 

### Frontend
The frontend of this project is built using Remix and React. Remix is a powerful framework that allows for server-rendered React applications. With React, we can create interactive and dynamic user interfaces, enhancing the user experience.

### Database
The database used for this project is PostgreSQL. PostgreSQL is a reliable and feature-rich open-source database management system. It offers advanced data management capabilities and ensures the security and integrity of your data. Success is a single tennant small data product. All types of data needs should eb handled by Postgres, ranging from Search, Cache and Data. 

## Support

If you encounter any issues or have any questions about Success, submit a GitHub issue. 

## License

Success is licensed under the [MIT License](LICENSE). Feel free to use, modify, and distribute this project as per the terms of the license.