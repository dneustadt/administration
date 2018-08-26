require('babel-register');

const process = require('process');
const seleniumServer = require('selenium-server');
const chromedriver = require('chromedriver');

module.exports = {
    src_folders: ['vendor/shopware/platform/src/Administration/Resources/administration/test/e2e/specs'],
    output_folder: 'build/artifacts/e2e',

    selenium: {
        start_process: true,
        server_path: seleniumServer.path,
        host: '127.0.0.1',
        port: 4444,
        cli_args: {
            'webdriver.chrome.driver': chromedriver.path
        }
    },

    test_settings: {
        default: {
            filter: '**/*.spec.js',
            launch_url: `${process.env.APP_URL}/admin`,
            selenium_port: 4444,
            selenium_host: 'localhost',
            screenshots: {
                enabled: true,
                on_failure: true,
                path: 'build/artifacts/e2e/screenshots/'
            },
            desiredCapabilities: {
                browserName: 'chrome',
                javascriptEnabled: true,
                acceptSslCerts: true,
                chromeOptions: {
                    args: [
                        '--remote-debugging-port=9222',
                        '--no-sandbox',
                        '--headless',
                        '--disable-web-security',
                        '--ignore-certificate-errors'
                    ]
                }
            },
            globals: {
                waitForConditionTimeout: 5000
            }
        }
    }
};
