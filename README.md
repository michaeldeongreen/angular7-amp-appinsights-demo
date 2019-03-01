# Overview

This guide provides a general overview of the components that allow for Azure Media Player Telemetry to be sent to Azure Application Insights.  The classes discussed in this README are located in the *app-diagnostics* folder.  Please see the blog link in the *External Resources* section for an overview of how the Angular application works.

## How to Run the Angular 7 Application
* Create an Application Insights Resource in the Azure Portal.  Official documentation can be found [here](https://docs.microsoft.com/en-us/azure/azure-monitor/app/create-new-resource)
* Install Docker. Official documentation can be found [here](https://docs.docker.com/install/)
* Clone the *angular7-amp-appinsights-demo* Git Repository
* Open a Terminal/Command Prompt and navigate to the directory where you cloned the repository and run the following commands:
```bash
# Build docker image and run container
docker build -t angular7-amp-appinsights-demo:1.0.0 . \ 
&& docker run -p 4200:80 angular7-amp-appinsights-demo:1.0.0
```

Note: Linux users *may* need to use *sudo*


## AmpDiagnosticsLoggerService Dependencies:
* [applicationinsights-js](https://www.npmjs.com/package/applicationinsights-js)
* [azuremediaplayer.min.js](https://amp.azure.net/libs/amp/latest/azuremediaplayer.min.js)

## AmpDiagnosticsLoggerService Components

**AmpDiagnosticsLoggerConfiguration interface** - This interface is used to initialize the *AmpDiagnosticsLoggerService* Service when a Angular Component is ready to use the service.  The interface has 3 properties:

* appName - The name of the application that is using the *AmpDiagnosticsLoggerService* service.  This can be set to any value.
* instrumentationKey - The Application Insights Instrumentation Key used by [applicationinsights-js](https://www.npmjs.com/package/applicationinsights-js)
* player - The *azuremediaplayer.d.ts* player object


**AmpDiagnosticsLoggerService Service**  - This service is a custom TypeScript service and is a conversion of the [amp-diagnosticsLogger.js](https://github.com/Azure-Samples/media-services-javascript-azure-media-player-diagnostic-logger-plugin/blob/master/amp-diagnosticsLogger.js) JavaScript library to TypeScript as there wasn't any TypeScript libraries to use at this time.


The service has 2 public methods:
* **initialize Method** - This method accepts a *AmpDiagnosticsLoggerConfiguration* object and initializes the *AmpDiagnosticsLoggerService* service by setting important private variables.  This method also sets the *callback* variable, which is used to log telemetry data to Application Insights.
* **log Method** - This method accepts a **string** to serve as the value for the Application Insights *User Id* field.  At the time this documentation was written, we are using the *ProjectId* field from the *Project* Table. This method evaluates the *_isInitalized* and *_isConfigured* private variables to determine if plumbing to wireup the *Azure Media Player* events to send telemetry data to Application Insights.

If *_isInitialized* is false, the service will log a warning to the JavaScript console.  If *_isConfigured* is false,  the method will:
* Execute the code to add a [TelemetryInitializer](https://github.com/Microsoft/ApplicationInsights-JS/blob/master/API-reference.md) to the *applicationinsights-js* node package AppInsights object context.  The TelemetryInializer is used to set the Application Insights *User Id* field via the *['ai.user.id']* tag.
* Execute the code to wireup the *Azure Media Player* events to send telemetry data to Application Insights.  At the time this documentation was written, all *Azure Media Player* events are being logged to Application insights.

## Possible Improvements to the AmpDiagnosticsLoggerService Service
* **Mocking** - In the future, it would be beneficial inject the *amp* and *AppInsights* object into the *AmpDiagnosticsLoggerService* service.  The *amp* object is just a namespace, so I was not able to figure out how to inject this object.  I was able to inject the *AppInsights* object into the constructor but I observed very odd and inconsistent behavior when not just using this object directly.  Injecting these objects into the constructor will allow for the service to be tested via mocking.
* **Custom Callback** - In the future, it may be beneficial to make the *callback* variable a property in the *AmpDiagnosticsLoggerConfiguration* interface to allow for custom code for logging.
* **Protect Instrumentation Key** - The Application Insights Instrumentation Key can been viewed in developer tools when the [applicationinsights-js](https://www.npmjs.com/package/applicationinsights-js) node package sends telemetry data to Application Insights.  In the future, you may want to routinely generate a new key or send the data to the Middle-Tier and then send to Application Insights.
* **Configurable Console Logging** - In the future, it may be benefical to add a new property to the *AmpDiagnosticsLoggerConfiguration* interface that can be used to turn on/off console logging in the *AmpDiagnosticsLoggerService* Service.  
* **Configure Events** - In the future, it may be beneficial to make configurable which Azure Media Player Events are sent to Application Insights.

## External Resources
[How to send Azure Media Player Telemetry Information to Azure Application Insights in a Angular 7 Application](https://blog.michaeldeongreen.com/post/how-to-send-azure-media-player-telemetry-information-to-azure-application-insights-in-a-angular-7-application)

## License

Copyright (c) Microsoft Corporation. All rights reserved.

Licensed under the [MIT](https://github.com/michaeldeongreen/angular7-amp-appinsights-demo/blob/master/LICENSE.txt) License.