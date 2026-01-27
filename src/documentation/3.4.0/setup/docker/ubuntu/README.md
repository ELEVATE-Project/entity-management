# entity-management

<div align="center">

# Entity Management

<a href="https://shikshalokam.org/elevate/">
<img
    src="https://shikshalokam.org/wp-content/uploads/2021/06/elevate-logo.png"
    height="140"
    width="300"
  />
</a>

[![CircleCI](https://dl.circleci.com/status-badge/img/gh/ELEVATE-Project/notification/tree/master.svg?style=shield)](https://dl.circleci.com/status-badge/redirect/gh/ELEVATE-Project/notification/tree/master)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=ELEVATE-Project_notification&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=ELEVATE-Project_notification)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=ELEVATE-Project_notification&metric=coverage)](https://sonarcloud.io/summary/new_code?id=ELEVATE-Project_notification)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=ELEVATE-Project_notification&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=ELEVATE-Project_notification)
[![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io)
[![Docs](https://img.shields.io/badge/Docs-success-informational)](https://elevate-docs.shikshalokam.org/mentorEd/intro)
[![Docs](https://img.shields.io/badge/API-docs-informational)](https://dev.elevate-apis.shikshalokam.org/notification/api-doc)
![GitHub package.json version (subfolder of monorepo)](https://img.shields.io/github/package-json/v/ELEVATE-Project/notification?filename=src%2Fpackage.json)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)

<details><summary>CircleCI insights</summary>

[![CircleCI](https://dl.circleci.com/insights-snapshot/gh/ELEVATE-Project/notification/master/buil-and-test/badge.svg?window=30d)](https://app.circleci.com/insights/github/ELEVATE-Project/notification/workflows/buil-and-test/overview?branch=master&reporting-window=last-30-days&insights-snapshot=true)

</details>

</br>
This Service enables the creation and management of various entities and entityType .It
    provides functionalities for entities, ensuring seamless integration and
    maintenance of entity-related data across the platform.
</div>

<br>

# System Requirements

-   **Operating System:** Ubuntu 22
-   **Node.js:** v20
-   **mongoDb:** v4

## Dockerized Service With Local Dependencies

**Expectation**: Run single docker containerized service with existing local (in host) or remote dependencies.

## Installation

**Create project Directory:** Establish a directory titled **project**.

> Example Command: `mkdir entity-management && cd entity-management/`

> Note: All commands are run from the project directory.

## Operating Systems: Linux

> **Caution:** Before proceeding, please ensure that the ports given here are available and open. It is essential to verify their availability prior to moving forward. You can run below command in your terminal to check this

```
for port in 5001 27017; do
    if sudo lsof -iTCP:$port -sTCP:LISTEN &>/dev/null; then
        echo "Port $port is IN USE"
    else
        echo "Port $port is available"
    fi
done
```

1. **Download and execute main setup script:** Execute the following command in your terminal from the project directory.
    ```
    curl -OJL https://raw.githubusercontent.com/ELEVATE-Project/project-service/refs/heads/setupGuide-3.4/documentation/3.4.0/dockerized/scripts/stand-alone/ubuntu/setup_project.sh && chmod +x setup_project.sh && sudo ./setup_project.sh
    ```

> Note : The script will download all the essential files and launch the services in Docker. Once all services are successfully up and running, you can proceed to the next steps.

**General Instructions :**

1. All containers which are part of the docker-compose can be gracefully stopped by pressing Ctrl + c in the same terminal where the services are running.
2. All docker containers can be stopped and removed by using below command.

```
sudo ./docker-compose-down.sh
```

3. All services and dependencies can be started using below command.

```
sudo ./docker-compose-up.sh
```

</details>

<br>

# Postman Collections

-   [Entity-Management Service](https://github.com/ELEVATE-Project/entity-management/tree/main/src/api-doc)

# Used in

This project was built to be used with [Project Service](https://github.com/ELEVATE-Project/project-service) and [User Service](https://github.com/ELEVATE-Project/user.git).

The frontend/mobile application [repo](https://github.com/ELEVATE-Project/observation-survey-projects-pwa).

You can learn more about the full implementation of project-service [here](https://elevate-docs.shikshalokam.org/.project/intro) .

# Team

<a href="https://github.com/ELEVATE-Project/entity-management/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=ELEVATE-Project/entity-management" />
</a>

<br>

# Open Source Dependencies

Several open source dependencies that have aided Mentoring's development:

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![Git](https://img.shields.io/badge/git-%23F05033.svg?style=for-the-badge&logo=git&logoColor=white)
