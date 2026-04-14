import { Component, OnInit } from '@angular/core';
import { SidenavComponent } from "./components/sidenav/sidenav.component";
import { SpinnerComponent } from "./shared/spinner/spinner.component";

@Component({
  selector: 'app-root',
  imports: [SidenavComponent, SpinnerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{
  //constructor(private webSocketService: WebSocketService){}
  title = 'front';
  ngOnInit() {
    //this.webSocketService.autoReconnectIfTokenExists();
  }
}
