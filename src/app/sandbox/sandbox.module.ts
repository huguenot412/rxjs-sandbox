import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SandboxComponent } from './containers/sandbox/sandbox.component';
import { SandboxRoutingModule } from './sandbox-routding.module';



@NgModule({
  declarations: [SandboxComponent],
  imports: [
    CommonModule,
    SandboxRoutingModule
  ]
})
export class SandboxModule { }
