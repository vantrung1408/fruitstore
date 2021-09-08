## Installation
After clone project source code then we are using docker to build and run by execute below command.
```sh
docker-compose build
docker-compose up
```
If everything ok, we can test by making request to `http://localhost:8080/ping` for check.

## Testing with jest
This project using [jest](https://jestjs.io/) framework as default testing framework to check source code test case and also test coverage too
```sh
npm install 
npm test
```

```sh
> fruit@1.0.0 test C:\Users\84962\Desktop\fruit
> jest

 PASS  test/app.test.js
 PASS  test/controllers/orderController.test.js (5.725 s)
 PASS  test/controllers/fruitController.test.js (6.212 s)
 PASS  test/controllers/userController.test.js (12.327 s)
A worker process has failed to exit gracefully and has been force exited. This is likely caused by tests leaking due to improper teardown. Try running with --detectOpenHandles to find leaks.

Test Suites: 4 passed, 4 total
Tests:       21 passed, 21 total
Snapshots:   0 total
Time:        13.315 s
Ran all test suites.
```

Test coverage can check by execute `npx jest --coverage`, result is something look like this
```sh
 PASS  test/app.test.js
 PASS  test/controllers/orderController.test.js (5.564 s)
 PASS  test/controllers/fruitController.test.js (5.941 s)
 PASS  test/controllers/userController.test.js (12.004 s)
A worker process has failed to exit gracefully and has been force exited. This is likely caused by tests leaking due to improper teardown. Try running with --detectOpenHandles to find leaks.
---------------------------|---------|----------|---------|---------|-------------------
File                       | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
---------------------------|---------|----------|---------|---------|-------------------
All files                  |    92.8 |    77.59 |   95.96 |   92.65 |
 fruit                     |     100 |      100 |     100 |     100 |
  app.js                   |     100 |      100 |     100 |     100 |
 fruit/config              |     100 |      100 |     100 |     100 |
  index.js                 |     100 |      100 |     100 |     100 |
 fruit/controllers         |     100 |      100 |     100 |     100 |
  fruitController.js       |     100 |      100 |     100 |     100 |
  fruitRecordController.js |     100 |      100 |     100 |     100 |
  index.js                 |     100 |      100 |     100 |     100 |
  orderController.js       |     100 |      100 |     100 |     100 |
  userController.js        |     100 |      100 |     100 |     100 |
 fruit/middlewares         |    88.1 |    78.13 |     100 |    88.1 |
  auth.js                  |   87.18 |    75.76 |     100 |   87.18 | 32-38,69-70
  body.js                  |     100 |      100 |     100 |     100 |
  health.js                |     100 |      100 |     100 |     100 |
  paging.js                |   93.33 |    91.67 |     100 |   93.33 | 12
  search.js                |   83.33 |    66.67 |     100 |   83.33 | 27,31-33,41
 fruit/models              |   90.16 |       75 |   85.71 |      90 |
  fruitModel.js            |   88.89 |      100 |   66.67 |   88.89 | 26
  fruitRecordModel.js      |     100 |      100 |     100 |     100 |
  index.js                 |      80 |       50 |     100 |      80 | 29-39
  orderModel.js            |   81.82 |      100 |      50 |   81.82 | 28,41
  userModel.js             |     100 |      100 |     100 |     100 |
 fruit/routes              |     100 |      100 |     100 |     100 |
  index.js                 |     100 |      100 |     100 |     100 |
 fruit/services            |   91.63 |    76.34 |    97.5 |    91.4 |
  fruitRecordService.js    |   95.24 |    66.67 |     100 |   95.24 | 26
  fruitService.js          |   86.36 |    78.95 |     100 |   86.36 | 19,29,52-55,68-71
  orderService.js          |    91.8 |    90.48 |     100 |   91.07 | 16,26,39,49-52
  userService.js           |   94.34 |    80.77 |     100 |   94.34 | 83,102-105
  utilService.js           |   91.67 |    57.14 |   93.33 |   91.49 | 54-58
 fruit/test                |   98.18 |    77.78 |     100 |   98.08 |
  common.js                |   98.18 |    77.78 |     100 |   98.08 | 47
---------------------------|---------|----------|---------|---------|-------------------

Test Suites: 4 passed, 4 total
Tests:       21 passed, 21 total
Snapshots:   0 total
Time:        13.156 s
Ran all test suites.
```
## Testing with postman
First, let import postman collection and enviroment file under `\test\postman` folder
After successful import we have something look like this

![image](https://user-images.githubusercontent.com/24761814/132467472-a8a4c1e3-c38e-42aa-9707-1feed818780e.png)
![image](https://user-images.githubusercontent.com/24761814/132467579-97bcc004-1b87-4ca2-abaa-b20921f087bc.png)

Please update `base_url` variable in enviroments to docker nodejs output port, by default setting it will be `http://localhost:8080`
After update url we can testing by using postman collections runner.
Getting started with `login success`

![image](https://user-images.githubusercontent.com/24761814/132468129-4f0e72c0-bc75-4d31-8486-1b4ad70ed391.png)

Click `run` then in Runner interface click `Run FruitStore`

![image](https://user-images.githubusercontent.com/24761814/132468239-846d2960-cf5d-47f1-8d18-b12c5af0aa81.png)

Postman will automate trigger each api to test 

![image](https://user-images.githubusercontent.com/24761814/132468363-71f9111e-7969-4f46-b480-e49bb68c8865.png)

## Cheers!
