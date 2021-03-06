# StatusTick API - Website Monitoring & Alert System

[![Software License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](LICENSE.md)

StatusTick API is a platform that monitoring websites and trigger various alert if something wrong

## Getting Started

Clone the repo:
```sh
git clone git@github.com:statustick/statustick-api.git
cd statustick-api
```

Install yarn:
```js
npm install -g yarn
```

Install dependencies:
```sh
yarn
```

Set environment (vars):
```sh
cp .env.example .env
```

Start server:
```sh
# Start server
yarn start

# Selectively set DEBUG env var to get logs
DEBUG=statustick-api:* yarn start
```
Refer [debug](https://www.npmjs.com/package/debug) to know how to selectively turn on logs.


Tests:
```sh
# Run tests written in ES6 
yarn test

# Run test along with code coverage
yarn test:coverage

# Run tests enforcing code coverage (configured via .istanbul.yml)
yarn test:check-coverage
```

Lint:
```sh
# Lint code with ESLint
yarn lint
```

##### Deployment

```sh
# install production dependencies only
yarn --production

Use any process manager to start your services
pm2 start manifest.json
```

In production you need to make sure your server is always up so you should ideally use any of the process manager recommended [here](http://expressjs.com/en/advanced/pm.html).
We recommend [pm2](http://pm2.keymetrics.io/) as it has several useful features like it can be configured to auto-start your services if system is rebooted.

## Logging

Universal logging library [winston](https://www.npmjs.com/package/winston) is used for logging. It has support for multiple transports.  A transport is essentially a storage device for your logs. Each instance of a winston logger can have multiple transports configured at different levels. For example, one may want error logs to be stored in a persistent remote location (like a database), but all logs output to the console or a local file. We just log to the console for simplicity, you can configure more transports as per your requirement.


## Docker

```sh
# For Development
# service restarts on file change
bash bin/development.sh
```


```sh
# For Testing
# service restarts on file change
bash bin/test.sh
```

#### Building and running without Docker Compose
```bash
# To use this option you need to make sure mongodb is listening on port 27017 and redis on port 6379

# Build docker 
docker build -t statustick-api .

# Run docker
docker run -p 8080:8080 statustick-api
```


## Change log

Please see [CHANGELOG](CHANGELOG.md) for more information on what has changed recently.

## Contributing

Contributions are **welcome** and will be fully **credited**.

We accept contributions via Pull Requests on [Github](https://github.com/statustick/statustick-api).

## Security

If you discover any security related issues, please email mustafa@statustick.com instead of using the issue tracker.

## Credits

- [Mustafa Berberoglu](https://github.com/mberberoglu)
- [All Contributors](../../contributors)

## Special Thanks

[Egghead.io - How to Write an Open Source JavaScript Library](https://egghead.io/courses/how-to-write-an-open-source-javascript-library)

[Express & mongoose REST API Boilerplate in ES6 with Code Coverage](https://github.com/KunalKapadia/express-mongoose-es6-rest-api)

## License

The MIT License (MIT). Please see [License File](LICENSE.md) for more information.
