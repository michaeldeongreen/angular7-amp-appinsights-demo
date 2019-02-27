import { Component, AfterViewInit, OnInit } from '@angular/core';
import { AmpDiagnosticsLoggerService } from './amp-diagnostics/amp-diagnostics-logger.service';
import { AmpDiagnosticsLoggerConfiguration } from './amp-diagnostics/amp-diagnostics-logger-configuration';
import { Mezzanine } from './mezzanine';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit, OnInit {
  title = 'angular7-amp-appinsights-demo';
  private player: amp.Player; // azuremediaplayer.d.ts object.  See Azure Media Player documentation for details.
  public Mezzanines: Mezzanine[];

  constructor(private ampDiagnosticsLoggerService: AmpDiagnosticsLoggerService) { }

  ngOnInit() {
    // Hardcoded list of mezzanine objects
    this.Mezzanines = [{ id: 'project-000-001', title: 'Movie 1', url: '//amssamples.streaming.mediaservices.windows.net/91492735-c523-432b-ba01-faba6c2206a2/AzureMediaServicesPromo.ism/manifest' },
    { id: 'project-000-002', title: 'Movie 2', url: '//amssamples.streaming.mediaservices.windows.net/91492735-c523-432b-ba01-faba6c2206a2/AzureMediaServicesPromo.ism/manifest' },
    { id: 'project-000-003', title: 'Movie 3', url:'//amssamples.streaming.mediaservices.windows.net/91492735-c523-432b-ba01-faba6c2206a2/AzureMediaServicesPromo.ism/manifest' }];
  }

  ngAfterViewInit() {
    // Azure Media Player configuration
    var options = {
      "nativeControlsForTouch": false,
      autoplay: true,
      controls: true,
      width: "640",
      height: "400"
    };

    // Get player object on app.component.html
    this.player = amp('vid1', options);

    // Configure AmpDiagnosticsLoggerConfiguration
    // Initialize ampDiagnosticsLoggerService
    const ampDiagnosticsLoggerConfiguration: AmpDiagnosticsLoggerConfiguration =  {
      appName: 'play-media-component',
      player: this.player,
      instrumentationKey: 'APPLICATION INSIGHTS INSTRUMENTATION KEY HERE'};
      this.ampDiagnosticsLoggerService.initialize(ampDiagnosticsLoggerConfiguration);
  }

  /**
   * setMovie method is called when the user clicks on the play icon or url of the mezzanine row on app.component.html
   * @param mezzanine custom interface used in demo that has an id, title and url
   */
  public setMovie(mezzanine: Mezzanine) {
    this.player.src([{ src: mezzanine.url,
    type: 'application/vnd.ms-sstr+xml' }, ]);
    this.ampDiagnosticsLoggerService.log(mezzanine.id);
  }
}
