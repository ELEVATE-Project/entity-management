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

-   **Operating System:** Mac
-   **Node.js:** v20
-   **mongoDb:** v4
-   **Kafka:** 2.13

## Local Service With Local Dependencies - Mac

**Expectation**: Run single service with existing local dependencies in host (**Non-Docker Implementation**).

## Installations

### Install Node.js LTS

Refer to the [NodeSource distributions installation scripts](https://nodejs.org/en/download/) for Node.js installation.

```bash
brew install node
```

### Install Kafka

Refer to the [Kafka installation scripts](https://kafka.apache.org/community/downloads/) for Kafka installation.

### Install PM2

**Run the following command**

```bash
npm install -g pm2
```

## Setting up Repository

### Clone the entity-management repository to /opt/backend directory

```bash
 git clone -b develop https://github.com/ELEVATE-Project/entity-management
```

### Install Npm packages from src directory

```bash
cd entity-management/src && npm i
```

### Create .env file in src directory

```bash
sudo nano .env
```

Copy-paste the following env variables to the `.env` file:

```env
# entity-management Service Config

# Port on which service runs
APPLICATION_PORT = 5001

# Application environment
APPLICATION_ENV ="development"

# Route after the base URL
APPLICATION_BASE_URL='/entity-management/'

#Internal Access Token to decode
INTERNAL_ACCESS_TOKEN =xahusub12yexlashsbxAXADHBlaj

ACCESS_TOKEN_SECRET=bsj82AHBxahusub12yexlashsbxAXADHBlaj

# MongoDB Connection to the service
MONGODB_URL=mongodb://localhost:27017/elevate-entity

AUTH_METHOD = native

#User Service Url
USER_SERVICE_URL = http://localhost:5001

USER_SERVICE_BASE_URL=/user

SERVICE_NAME = elevate-entity-service

#API Doc URL
API_DOC_URL="http://localhost:5001/entity-management/api-doc"

APPLICATION_HOST=localhost

IS_AUTH_TOKEN_BEARER="false"

ADMIN_ACCESS_TOKEN=rwwee3$123

ADMIN_TOKEN_HEADER_NAME="admin-auth-token"

#kafka health check topic
KAFKA_HEALTH_CHECK_TOPIC='KAFKA_HEALTH_CHECK_TOPIC'

#Interface URL
INTERFACE_SERVICE_URL=http://localhost:5001

KAFKA_HEALTH_CHECK_TOPIC = entity-health-check-topic-check

KAFKA_URL = kafka:9092

KAFKA_COMMUNICATIONS_ON_OFF = ON

KAFKA_GROUP_ID = entity

HEALTH_CHECK_DEBUG_MODE = true
```

Save and exit.

## Setting up Databases

**Start MongoDB Service**

```bash
sudo systemctl start mongod
```

**Verify MongoDB is running**

```bash
sudo systemctl status mongod

```

## Start the Service

Navigate to the src folder of entity-management service and run pm2 start command:

```bash
pm2 start app.js --name elevate-entity-management
```

#### Run pm2 ls command

```bash
$ pm2 ls
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
![Apache Kafka](https://img.shields.io/badge/Apache%20Kafka-000?style=for-the-badge&logo=apachekafka)
