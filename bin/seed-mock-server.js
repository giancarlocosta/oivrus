
const Promise = require('bluebird');
const co = Promise.coroutine;
const mockServer = require('mockserver-client');
const mockServerClient = mockServer.mockServerClient;
const proxyClient = mockServer.proxyClient;

let status = '';

const SERVER = process.env.SERVICE_HOST || '0.0.0.0';

function mockResponse(numMocks) {
  return co(function* () {
    try {

      yield mockServerClient(SERVER, 1080).reset();
      for (let i = 0; i < numMocks; i++) {
        yield mockServerClient(SERVER, 1080).mockAnyResponse({
          httpRequest: {
            method: 'GET',
            path: '/api/status'
          },
          httpResponse: {
            statusCode: 200,
            body: JSON.stringify({ running: true }),
            delay: {
              timeUnit: 'MILLISECONDS',
              value: 0
            }
          },
          times: {
            remainingTimes: 1,
            unlimited: false
          }
        });
      }

      yield mockServerClient(SERVER, 1080).mockAnyResponse({
        httpRequest: {
          method: 'GET',
          path: '/api/metadata/e1'
        },
        httpResponse: {
          statusCode: 200,
          body: JSON.stringify({
            data: {
              idtoextrefmap: {
                'e1': 'e1-extref',
                'p1': 'p1-extref'
              }
            }
          }),
          delay: {
            timeUnit: 'MILLISECONDS',
            value: 0
          }
        },
        times: {
          remainingTimes: 1,
          unlimited: true
        }
      });

      status = 'success';

    } catch (e) {
      console.log(`\n\nSEEDING OF MOCK SERVER FAILED!\n\n`);
      console.log(e);
      status = 'fail';
    }
    return Promise.resolve();
  })();
}


mockResponse(10);
// Dont exit node script until async function done
(function wait() {
  if (status === 'success') {
    process.exit(0);
  } else if (status === 'fail') {
    process.exit(1);
  }
  setTimeout(wait, 1000);
})();
