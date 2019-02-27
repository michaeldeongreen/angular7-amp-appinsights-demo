/*
The AmpDiagnosticsLoggerService class is a basic port of the amp-diagnosticsLogger.js library to TypeScript.
The service uses the applicationinsights-js npm package to log telemetry information from Azure Media Servies
to Azure Application Insights.

amp-diagnosticsLogger.js:
https://github.com/Azure-Samples/media-services-javascript-azure-media-player-diagnostic-logger-plugin/blob/master/amp-diagnosticsLogger.js

applicationinsights-js:
https://www.npmjs.com/package/applicationinsights-js
*/

import { Injectable, Inject, OnInit } from '@angular/core';
import { AppInsights } from 'applicationinsights-js';
import { AmpDiagnosticsLoggerConfiguration } from './amp-diagnostics-logger-configuration';

@Injectable({
  providedIn: 'root',
})
export class AmpDiagnosticsLoggerService implements OnInit {
  private _amp = amp;
  private _appName: string;
  private _ampDiagnosticsLoggerConfiguration: AmpDiagnosticsLoggerConfiguration;
  private _callback;
  private _instrumentationKey: string;
  private _isConfigured: boolean;
  private _isInitialized: boolean;
  private _player: amp.Player;
  private _uniqueIdentifier: string;

  ngOnInit() {
    this._isConfigured = false;
    this._isInitialized = false;
  }

  /**
   * start method is the entry point for the AmpDiagnosticsLoggerService
   * @param ampDiagnosticsLoggerConfiguration Configuration parameters for the AmpDiagnosticsLoggerService
   */
  public initialize(ampDiagnosticsLoggerConfiguration: AmpDiagnosticsLoggerConfiguration): void {
    // set config values
    this._ampDiagnosticsLoggerConfiguration = ampDiagnosticsLoggerConfiguration;
    this._appName = this._ampDiagnosticsLoggerConfiguration.appName;
    this._instrumentationKey = ampDiagnosticsLoggerConfiguration.instrumentationKey;
    this._player = ampDiagnosticsLoggerConfiguration.player;
    AppInsights.downloadAndSetup({ instrumentationKey: this._instrumentationKey });
    this._callback = function(data) {
      // log to console
      // console.log('APPINSIGHTS TRACKEVENT CALL', data.eventId); // TROUBLESHOOTING
      // track event to application insights events
      AppInsights.trackEvent(data.eventId);
      // if error, track exception in application insights
      if (data.eventId = 'Error') {
        AppInsights.trackException(data);
      }
    };
    // set flag to inform that service is initialized
    this._isInitialized = true;
  }

  /**
   * log method accepts a unique identifier which is the User Id in Azure Application Insights.
   * Sets the unique identifier
   * Clears the Auth. User Context
   * Re-set the Auth. User Context
   * Call configure method
   * @param uniqueIdentifier used to set the Azure Application Insights User Id
   */
  public log(uniqueIdentifier: string): void {
    this._uniqueIdentifier = uniqueIdentifier;
    AppInsights.clearAuthenticatedUserContext();
    AppInsights.setAuthenticatedUserContext(uniqueIdentifier);
    this.configure();
  }

  /**
   * configure method configure AmpDiagnosticsLoggerService
   * Ensures that the initialize method has been called
   * Ensures that the configure methods are only called once, which is the first time log is called
   */
  private configure(): void {
    if (this._isInitialized) {
      if (!this._isConfigured) {
        this.configureApplicationInsights();
        this.configureAMP();
        this._isConfigured = true;
      }
    } else {
      console.log('Please call the Initialize method');
    }
  }

  /**
   * configureApplicationInsights method creates a TelemetryInitializer to set the Azure Application Insights User Id
   */
  private configureApplicationInsights(): void {
    /*
    See: https://github.com/Microsoft/ApplicationInsights-JS/issues/571
    */
    // update anonymous id generated by sdk with authenticated user id as not shown by default in portal yet
    const telemetryInitializer = () => {
      AppInsights.context.addTelemetryInitializer((envelope) => {
        const tags = envelope.tags;
        // console.log('Tags', tags); // FOR TROUBLESHOOTING ONLY
        if (tags && tags['ai.user.id']) {
          // console.log('Setting the ai.user.id'); // FOR TROUBLESHOOTING ONLY
          tags['ai.user.id'] = this._uniqueIdentifier;
        }
      });
    };
    if (AppInsights.queue !== undefined) {
      AppInsights.queue.push(telemetryInitializer);
    } else {
      telemetryInitializer();
    }
  }

  /**
   * configureAMP method helps wire up the Azure Media Player events
   */
  private configureAMP() {
    this._player.ready(this.handleReady.bind(this));
    this._player.addEventListener(this._amp.eventName.error, this.handleError.bind(this));
  }

  /**
   * handleReady method is run when the AMP is ready
   */
  private handleReady(): void {
    this._player.addEventListener(this._amp.eventName.loadedmetadata, this.handleLoadedMetaData.bind(this));

    const data = {
      appName: this._appName,
      uniqueIdentifier: this._uniqueIdentifier,
      ampVersion: this._player.getAmpVersion(),
      userAgent: navigator.userAgent,
      options: {
        autoplay: this._player.options().autoplay,
        heuristicProfile: this._player.options().heuristicProfile,
        techOrder: JSON.stringify(this._player.options().techOrder),
      },
    };

    this.logData('InstanceCreated', 1, data);
  }

  /**
   * handleLoadedMetaData method handles AMP loadedmetadata event.  It wires up all of the event AMP  fires
   */
  private handleLoadedMetaData(): void {
    this._player.addEventListener(this._amp.eventName.playbackbitratechanged, this.handlePlaybackBitrateChanged.bind(this));
    this._player.addEventListener(this._amp.eventName.downloadbitratechanged, this.handleDownloadBitrateChanged.bind(this));
    this._player.addEventListener(this._amp.eventName.play, this.handlePlay.bind(this));
    this._player.addEventListener(this._amp.eventName.playing, this.handlePlaying.bind(this));
    this._player.addEventListener(this._amp.eventName.seeking, this.handleSeeking.bind(this));
    this._player.addEventListener(this._amp.eventName.seeked, this.handleSeeked.bind(this));
    this._player.addEventListener(this._amp.eventName.pause, this.handlePaused.bind(this));
    this._player.addEventListener(this._amp.eventName.waiting, this.handleWaiting.bind(this));
    this._player.addEventListener(this._amp.eventName.fullscreenchange, this.handleFullScreenChange.bind(this));
    this._player.addEventListener(this._amp.eventName.canplaythrough, this.handleCanPlayThrough.bind(this));
    this._player.addEventListener(this._amp.eventName.ended, this.handleEnded.bind(this));

    if (this._player.audioBufferData()) {
      this._player.audioBufferData().addEventListener(this._amp.bufferDataEventName.downloadfailed, function() {
        const data = {
          appName: this._appName,
          uniqueIdentifier: this._uniqueIdentifier,
          sessionId: this._player.currentSrc(),
          currentTime: this._player.currentTime(),
          bufferLevel: this._player.audioBufferData().bufferLevel,
          url: this._player.audioBufferData().downloadFailed.mediaDownload.url,
          code: '0x' + this._player.audioBufferData().downloadFailed.code.toString(16),
          message: this._player.audioBufferData().downloadFailed,
        };

        this.logData('DownloadFailed', 0, data);
      });
    }

    if (this._player.videoBufferData()) {
      this._player.videoBufferData().addEventListener(this._amp.bufferDataEventName.downloadfailed, function() {
        const data = {
          appName: this._appName,
          uniqueIdentifier: this._uniqueIdentifier,
          sessionId: this._player.currentSrc(),
          currentTime: this._player.currentTime(),
          bufferLevel: this._player.videoBufferData().bufferLevel,
          url: this._player.videoBufferData().downloadFailed.mediaDownload.url,
          code: '0x' + this._player.videoBufferData().downloadFailed.code.toString(16),
          message: this._player.videoBufferData().downloadFailed,
        };

        this.logData('DownloadFailed', 0, data);
      });
    }

    const data = {
      appName: this._appName,
      uniqueIdentifier: this._uniqueIdentifier,
      sessionId: this._player.currentSrc(),
      isLive: this._player.isLive(),
      duration: this._player.duration(),
      tech: this._player.currentTechName(),
      protection: ((this._player.currentProtectionInfo() && this._player.currentProtectionInfo()[0])
        ? this._player.currentProtectionInfo()[0].type : 'clear'),
    };

    this.logData('PresentationInfo', 1, data);
  }

  /**
   * handleError method handles error events
   */
  private handleError(): void {
    const err = this._player.error();
    const data = {
      appName: this._appName,
      uniqueIdentifier: this._uniqueIdentifier,
      sessionId: this._player.currentSrc(),
      currentTime: this._player.currentTime(),
      code: '0x' + err.code.toString(16),
      message: err.message,
    };

    this.logData('Error', 0, data);
  }

  /**
   * handlePlaybackBitrateChanged method handles AMP PlaybackBitrateChanged event
   * @param event AMP playbackbitratechanged
   */
  private handlePlaybackBitrateChanged(event): void {
    this.logData('PlaybackBitrateChanged', 1, this.eventData(event));
  }

  /**
   * handleDownloadBitrateChanged method handles AMP DownloadBitrateChanged event
   * @param event AMP DownloadBitrateChanged
   */
  private handleDownloadBitrateChanged(event): void {
    this.logData('DownloadBitrateChanged', 1, this.eventData(event));
  }

  /**
 * handleWaiting method handles AMP Waiting event
 * @param event AMP Waiting
 */
  private handleWaiting(event): void {
    this.logData('Waiting', 0, this.eventData(event));
  }

  /**
   * handlePlay method handles AMP Play event
   * @param event AMP Play
   */
  private handlePlay(event): void {
    this.logData('Play', 1, this.eventData(event));
  }

  /**
   * handlePlaying method handles AMP Playing event
   * @param event AMP Playing
   */
  private handlePlaying(event): void {
    this.logData('Playing', 1, this.eventData(event));
  }

  /**
   * handleSeeking method handles AMP Seeking event
   * @param event AMP Seeking
   */
  private handleSeeking(event): void {
    this.logData('Seeking', 1, this.eventData(event));
  }

  /**
   * handleSeeked method handles AMP Seeked event
   * @param event AMP Seeked
   */
  private handleSeeked(event): void {
    this.logData('Seeked', 1, this.eventData(event));
  }

  /**
   * handlePaused method handles AMP Paused event
   * @param event AMP Paused
   */
  private handlePaused(event): void {
    this.logData('Paused', 1, this.eventData(event));
  }

  /**
   * handleFullScreenChange method handles AMP FullScreenChange event
   * @param event AMP FullScreenChange
   */
  private handleFullScreenChange(event): void {
    this.logData('FullScreenChange', 1, this.eventData(event));
  }

  /**
   * handleCanPlayThrough method handles AMP CanPlayThrough event
   * @param event AMP CanPlayThrough
   */
  private handleCanPlayThrough(event): void {
    this.logData('CanPlayThrough', 1, this.eventData(event));
  }

  /**
   * handleEnded method handles AMP Ended event
   * @param event AMP Ended
   */
  private handleEnded(event): void {
    this.logData('Ended', 1, this.eventData(event));
  }

  /**
   * logData method creates an eventLog wrapper object and passes this object to the callback method
   * @param eventId EventId of AMP Event
   * @param level Severity Level of AMP Event
   * @param data  Custom data provided with the AMP Event
   */
  private logData(eventId, level, data): void {
    const eventLog = {
      eventId: eventId,
      level: level,
      data: data,
    };

    this._callback(eventLog);
  }

  /**
   * @param event AMP Event
   * @returns data object that contains more detailed data about the event
   */
  private eventData(event) {
    return {
      appName: this._appName,
      uniqueIdentifier: this._uniqueIdentifier,
      sessionId: this._player.currentSrc(),
      currentTime: this._player.currentTime(),
      isLive: this._player.isLive(),
      event: event.type,
      presentationTimeInSec: event.presentationTimeInSec,
      message: event.message ? event.message : '',
    };
  }
}
